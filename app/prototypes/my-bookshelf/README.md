# My bookshelf

A personal reading tracker at `/prototypes/my-bookshelf`. Every row in your Notion database is treated as a book you have read. There is no Status property required.

## Run it

From the repository root:

```sh
npm install
npm run dev
```

Open [My bookshelf](http://localhost:3000/prototypes/my-bookshelf). The homepage also includes a link. Without Notion settings, the page shows six clearly labeled example books with typographic covers. These examples are never mixed with your live books. An empty connected database shows an empty shelf.

## Connect your database

1. Visit [Notion’s connections page](https://www.notion.so/profile/integrations) and create an **internal connection** for the workspace containing your database. Enable **Read content**. Copy the integration secret. Notion may use “integration” and “connection” interchangeably.
2. In Notion, open your original books database. Choose **••• → Connections** and add your new connection. If necessary, ask a workspace owner to grant access.
3. Copy the database ID from its link. In a link such as `https://www.notion.so/workspace/0123456789abcdef0123456789abcdef?v=...`, the database ID is `0123456789abcdef0123456789abcdef`. Do not use the view ID after `?v=`. The database ID also appears after `/p/` in newer Notion links. Hyphenated UUIDs work too.
4. Create or edit `.env.local` in the **repository root**, preserving any settings already there:

   ```dotenv
   NOTION_API_KEY=your_integration_secret
   NOTION_DATABASE_ID=your_database_id
   ```

   Never put the secret in a `NEXT_PUBLIC_` variable, commit it, or paste it into the browser. `.env.local` is already ignored by Git.
5. Match the property names and types below. Names are case-sensitive.
6. Restart the development server (`Ctrl+C`, then `npm run dev`) and reload the page. A “Connected to Notion” label confirms the connection. Use the refresh button to fetch changes after editing books in Notion.

### Properties

| Exact property name | Notion type | Display |
| --- | --- | --- |
| Title | Title | Book title; falls back to “Untitled book” |
| Author | Text / rich text | Author; falls back to “Unknown author” |
| Genre | Select (single select) | Genre badge and filter; empty values use “Uncategorized” |
| Cover Image | Files & media **or** URL | First attached image or an HTTP(S) image URL |
| Rating | Number | Your exact number; empty values use “—” |
| Review | Text / rich text | Full review, including line breaks |

The property must exist even when individual rows leave it empty. A page cover is used if Cover Image is empty. Missing or failed images use a locally rendered typographic cover. A URL must point directly to an image, not a website containing it. Text formatting is converted to plain text.

### Multiple data sources

Current Notion databases are containers with one or more **data sources**. A data source holds the properties and the rows. With one source, the prototype discovers it automatically from `NOTION_DATABASE_ID`.

For a database with multiple sources, set `NOTION_DATA_SOURCE_ID` to the source containing your books; it takes precedence over the database ID. Find the ID in Notion’s data source menu under **Manage data sources → Copy data source ID**. You can also retrieve the database with the [Retrieve a database API](https://developers.notion.com/reference/retrieve-a-database) and read the relevant entry from its `data_sources` array.

```dotenv
NOTION_API_KEY=your_integration_secret
NOTION_DATA_SOURCE_ID=your_books_data_source_id
```

## Use the gallery

- Search titles, authors, genres, or review text.
- Filter by genre; sort by recently added, highest rated, or title.
- Favorites shows ratings **4.5 and above**, assuming a five-point scale. Ratings are displayed without clamping or rounding; no values in Notion are changed.
- Open a live book in Notion using the link below its review.
- Refresh to retrieve new records, edits, and fresh image links. Notion-hosted image URLs expire, so refresh if an image stops loading after the page has been open for a long time.

## API implementation

Verified against official Notion documentation on **October 16, 2026**. Requests explicitly use `Notion-Version: 2026-03-11`, the latest documented version. The prototype uses native server-side `fetch`; no extra SDK or dependency is required.

1. `GET /v1/databases/{database_id}` discovers the data source when needed.
2. `GET /v1/data_sources/{data_source_id}` validates the six property types.
3. `POST /v1/data_sources/{data_source_id}/query` retrieves books, 100 per page, passing `next_cursor` unchanged as `start_cursor` until there are no more pages.

Requests and responses are uncached. Pagination pauses between requests, and rate-limit retries respect `Retry-After` (up to two retries for waits of at most 30 seconds). Each HTTP request has a 20-second timeout. API errors show useful setup guidance rather than silently replacing your books with demo data. A failed refresh preserves the last successful shelf and labels it as older data.

Notion limits a single query to 10,000 results. If its API reports an incomplete query, the page shows an explicit warning. Larger collections require query partitioning, which this reading prototype does not implement. Archived and trashed records are omitted.

The read-only endpoint is `/prototypes/my-bookshelf/api`. It keeps the integration secret on the server, but anyone who can access the running prototype can read the returned book data. Keep the app local for personal use; add authentication before hosting a private library publicly.

### Official documentation

- [API versioning](https://developers.notion.com/reference/versioning)
- [Database and data source model](https://developers.notion.com/reference/database)
- [Retrieve a data source](https://developers.notion.com/reference/retrieve-a-data-source)
- [Query a data source, pagination, and result limits](https://developers.notion.com/reference/query-a-data-source)
- [Page property values and expiring file links](https://developers.notion.com/reference/page-property-values)
- [Authorization and database access](https://developers.notion.com/guides/get-started/authorization)
- [Request limits](https://developers.notion.com/reference/request-limits)

## Verification

Run `npm run build` from the repository root to check TypeScript and compile all routes. Integration tests use a mocked Notion API and do not need credentials:

```sh
node --experimental-strip-types --test app/prototypes/my-bookshelf/notion.test.mjs
```

Live database verification requires your own connection secret and database ID.
