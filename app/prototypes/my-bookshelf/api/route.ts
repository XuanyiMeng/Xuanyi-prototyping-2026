import { NextResponse } from "next/server";
import { loadBooks } from "../notion";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const shelf = await loadBooks({
      token: process.env.NOTION_API_KEY,
      databaseId: process.env.NOTION_DATABASE_ID,
      dataSourceId: process.env.NOTION_DATA_SOURCE_ID,
    });
    return NextResponse.json(shelf, { headers });
  } catch (error) {
    const message = error instanceof Error && ["TimeoutError", "TypeError"].includes(error.name)
      ? "Could not reach Notion. Check your internet connection and try again."
      : error instanceof Error ? error.message : "Could not load your bookshelf.";
    return NextResponse.json({ error: message }, { status: 502, headers });
  }
}
