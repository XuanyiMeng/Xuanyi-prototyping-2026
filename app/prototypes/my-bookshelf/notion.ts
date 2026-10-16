import type { Book, ShelfResponse } from "./types";

export const NOTION_VERSION = "2026-03-11";
type RichText = { plain_text?: string; text?: { content: string } };
type FileValue = { type: string; file?: { url: string }; external?: { url: string } };
type Property = {
  type: string;
  title?: RichText[];
  rich_text?: RichText[];
  select?: { name: string } | null;
  files?: FileValue[];
  url?: string | null;
  number?: number | null;
};
type NotionPage = { object: string; id: string; url?: string; properties?: Record<string, Property>; cover?: FileValue | null; in_trash?: boolean; is_archived?: boolean };
const text = (parts?: RichText[]) => (parts ?? []).map(part => part.plain_text ?? part.text?.content ?? "").join("");

export function safeUrl(value?: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
const fileUrl = (file?: FileValue | null) => safeUrl(file?.type === "file" ? file.file?.url : file?.external?.url);

export function mapBook(page: NotionPage): Book {
  const p = page.properties ?? {};
  return {
    id: page.id,
    title: text(p.Title?.title) || "Untitled book",
    author: text(p.Author?.rich_text) || "Unknown author",
    genre: p.Genre?.select?.name || "Uncategorized",
    cover: (p["Cover Image"]?.type === "url" ? safeUrl(p["Cover Image"].url) : fileUrl(p["Cover Image"]?.files?.[0])) || fileUrl(page.cover),
    rating: typeof p.Rating?.number === "number" ? p.Rating.number : null,
    review: text(p.Review?.rich_text),
    url: safeUrl(page.url),
  };
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Called only by the server route. The integration secret never enters browser code.
export async function loadBooks(config: { token?: string; databaseId?: string; dataSourceId?: string }): Promise<ShelfResponse> {
  if (!config.token && !config.databaseId && !config.dataSourceId) return { mode: "demo", books: [] };
  if (!config.token || (!config.databaseId && !config.dataSourceId)) {
    throw new Error("Finish setup: add NOTION_API_KEY and NOTION_DATABASE_ID (or NOTION_DATA_SOURCE_ID) to .env.local, then restart the development server.");
  }
  const validateId = (value: string) => {
    if (!/^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(value)) {
      throw new Error("Use the Notion database or data source ID, rather than its full URL. See the connection guide.");
    }
    return value;
  };
  async function request<T>(path: string, body?: object, attempt = 0): Promise<T> {
    const response = await fetch(`https://api.notion.com/v1/${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${config.token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 429 && attempt < 2) {
      const delay = Number(response.headers.get("Retry-After") ?? "1");
      // Do not retry sooner than Notion asks; very long limits are shown to the reader.
      if (Number.isFinite(delay) && delay >= 0 && delay <= 30) {
        await wait(Math.max(1, delay) * 1000);
        return request<T>(path, body, attempt + 1);
      }
    }
    if (!response.ok) {
      const errors: Record<number, string> = {
        401: "Notion rejected the integration secret. Check NOTION_API_KEY and restart the server.",
        403: "The Notion connection needs Read content access to this database.",
        404: "Notion could not find this database or data source. Check the ID and add your connection in the database’s Connections menu.",
        429: "Notion is receiving too many requests. Wait a moment, then refresh your shelf.",
      };
      throw new Error(errors[response.status] ?? `Notion could not load your shelf (HTTP ${response.status}). Check the database setup and try again.`);
    }
    return response.json();
  }
  let sourceId = config.dataSourceId ? validateId(config.dataSourceId) : "";
  if (!sourceId) {
    const database = await request<{ data_sources?: { id: string; name: string }[] }>(`databases/${validateId(config.databaseId!)}`);
    const sources: { id: string; name: string }[] = database.data_sources ?? [];
    if (sources.length !== 1) throw new Error("This database has zero or multiple data sources. Set NOTION_DATA_SOURCE_ID to the source containing your books. See the connection guide.");
    sourceId = validateId(sources[0].id);
  }
  const schema = await request<{ properties: Record<string, { type: string }> }>(`data_sources/${sourceId}`);
  const expected: Record<string, string[]> = { Title: ["title"], Author: ["rich_text"], Genre: ["select"], "Cover Image": ["files", "url"], Rating: ["number"], Review: ["rich_text"] };
  const invalid = Object.entries(expected).filter(([name, types]) => !types.includes(schema.properties?.[name]?.type));
  if (invalid.length) throw new Error(`Check these Notion properties (names are case-sensitive): ${invalid.map(([name, types]) => `${name}: ${types.join(" or ")}`).join(", ")}.`);
  const books: Book[] = [];
  let cursor: string | undefined;
  let incomplete = false;
  do {
    const data = await request<{ results: NotionPage[]; has_more: boolean; next_cursor?: string; request_status?: { type: string } }>(`data_sources/${sourceId}/query`, { page_size: 100, sorts: [{ timestamp: "created_time", direction: "descending" }], ...(cursor ? { start_cursor: cursor } : {}) });
    books.push(...data.results.filter(page => page.object === "page" && !page.in_trash && !page.is_archived).map(mapBook));
    incomplete ||= data.request_status?.type === "incomplete";
    if (data.has_more && (!data.next_cursor || data.next_cursor === cursor)) throw new Error("Notion returned an invalid pagination cursor. Please refresh your shelf.");
    cursor = data.has_more ? data.next_cursor : undefined;
    if (cursor) await wait(350);
  } while (cursor);
  return { mode: "notion", books, ...(incomplete ? { warning: "Notion limited this query to 10,000 books. This shelf is incomplete; use a smaller data source to see all its books." } : {}) };
}
