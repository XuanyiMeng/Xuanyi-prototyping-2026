"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Book, ShelfResponse } from "./types";
import { demoBooks } from "./demo";
import styles from "./styles.module.css";

function Cover({ book, index }: { book: Book; index: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [book.cover]);
  return <div className={`${styles.coverStage} ${styles[`palette${index % 6}`]}`}>
    {book.cover && !failed ? <img className={styles.coverImage} src={book.cover} alt={`Cover of ${book.title}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> :
      <div className={styles.bookCover} aria-label={`${book.title}, ${book.cover ? "cover unavailable" : "typographic cover"}`}>
        <span className={styles.coverEyebrow}>{book.genre}</span><span className={styles.coverTitle}>{book.title}</span>
        <span className={styles.coverOrnament} aria-hidden="true">✳</span><span className={styles.coverAuthor}>{book.author}</span>
      </div>}
  </div>;
}

export default function MyBookshelf() {
  const [shelf, setShelf] = useState<ShelfResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All books");
  const [sort, setSort] = useState("recent");
  const [favorites, setFavorites] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true); setError("");
    try {
      const response = await fetch("/prototypes/my-bookshelf/api", { cache: "no-store", signal: current.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load your shelf.");
      setShelf(data.mode === "demo" ? { ...data, books: demoBooks } : data);
    } catch (err) {
      if (!current.signal.aborted) setError(err instanceof Error ? err.message : "Could not load your shelf.");
    } finally { if (!current.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => controller.current?.abort(); }, [load]);
  const books = shelf?.books ?? [];
  const genres = ["All books", ...Array.from(new Set(books.map(book => book.genre))).sort()];
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return books.filter(book => (genre === "All books" || genre === book.genre) && (!favorites || (book.rating !== null && book.rating >= 4.5)) && `${book.title} ${book.author} ${book.review} ${book.genre}`.toLocaleLowerCase().includes(query))
      .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "rating" ? (b.rating ?? -Infinity) - (a.rating ?? -Infinity) : 0);
  }, [books, search, genre, sort, favorites]);
  const rated = books.filter(book => book.rating !== null);
  const average = rated.length ? (rated.reduce((sum, book) => sum + book.rating!, 0) / rated.length).toFixed(1) : "—";
  return <div className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/prototypes/my-bookshelf"><span className={styles.brandIcon} aria-hidden="true">▤</span> my bookshelf<span className={styles.brandDot}>.</span></Link>
      <div className={styles.headerRight}><Link className={styles.backLink} href="/">All prototypes ↗</Link><button className={styles.connectButton} onClick={() => dialog.current?.showModal()}><span className={styles.notionIcon}>N</span> {shelf?.mode === "notion" ? "Connection guide" : "Connect Notion"}</button></div>
    </header>
    <main className={styles.main}>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>A LITTLE COLLECTION OF OTHER WORLDS</p><h1 className={styles.title}>My bookshelf<span className={styles.titleDot}>.</span></h1><p className={styles.subtitle}>The pages I’ve turned. The stories that stayed.</p></div>
        <div className={styles.heroNote}><span className={styles.flower} aria-hidden="true">✳</span><p>“A reader lives a thousand lives.”</p><span className={styles.quoteAuthor}>— George R. R. Martin</span></div>
      </section>
      <section className={styles.stats} aria-label="Reading statistics">
        <div className={styles.stat}><span className={styles.statNumber}>{shelf ? books.length.toString().padStart(2, "0") : "—"}</span><span className={styles.statLabel}>books on the shelf</span></div>
        <div className={styles.stat}><span className={styles.statNumber}>{shelf ? genres.length - 1 : "—"}</span><span className={styles.statLabel}>genres explored</span></div>
        <div className={styles.stat}><span className={styles.statNumber}>{average}<span className={styles.smallStar}> ★</span></span><span className={styles.statLabel}>average rating</span></div>
        <div className={styles.shelfNote}><span aria-hidden="true">↳</span> A life measured in good books.</div>
      </section>
      <div className={styles.collectionHeading}><div className={styles.tabs}><button className={`${styles.tab} ${!favorites ? styles.activeTab : ""}`} aria-pressed={!favorites} onClick={() => setFavorites(false)}>The collection <span>{books.length}</span></button><button className={`${styles.tab} ${favorites ? styles.activeTab : ""}`} aria-pressed={favorites} onClick={() => setFavorites(true)}>Favorites <span>★</span></button></div><p className={styles.source}><span className={shelf?.mode === "notion" ? styles.liveDot : styles.demoDot} />{shelf?.mode === "notion" ? "Connected to Notion" : "Sample collection"}</p></div>
      <div className={styles.toolbar}>
        <label className={styles.search}><span aria-hidden="true">⌕</span><input className={styles.searchInput} aria-label="Search books" placeholder="Find a book, author, or a little inspiration…" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className={styles.filters}><label className={styles.selectLabel}>Genre<select className={styles.select} value={genre} onChange={event => setGenre(event.target.value)}>{genres.map(value => <option key={value}>{value}</option>)}</select></label><label className={styles.selectLabel}>Sort by<select className={styles.select} value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently added</option><option value="rating">Highest rated</option><option value="title">Title A–Z</option></select></label><button className={styles.refreshButton} aria-label="Refresh bookshelf" onClick={() => void load()} disabled={loading}>{loading ? "…" : "↻"}</button></div>
      </div>
      {shelf?.mode === "demo" && <div className={styles.demoBanner}><p>You’re exploring a sample shelf. Connect your Notion database to make it yours.</p><button className={styles.textButton} onClick={() => dialog.current?.showModal()}>Set up your shelf ↗</button></div>}
      {error && <div className={styles.error} role="alert"><strong>Your shelf couldn’t refresh.</strong><p>{error}</p><button className={styles.textButton} onClick={() => void load()}>Try again ↻</button><button className={styles.textButton} onClick={() => dialog.current?.showModal()}>Connection guide ↗</button>{shelf && <p>The collection below is from the previous successful load.</p>}</div>}
      {shelf?.warning && <p className={styles.error} role="status">{shelf.warning}</p>}
      <p className={styles.results} role="status">{loading ? "Opening your bookshelf…" : shelf ? `${filtered.length} ${filtered.length === 1 ? "book" : "books"}${favorites ? " rated 4.5 or above" : " in your collection"}` : "Waiting for your collection"}</p>
      {loading && !shelf ? <div className={styles.empty}>A new story is just a moment away…</div> : <div className={styles.gallery}>
        {filtered.map((book, index) => <article className={styles.card} key={book.id}>
          <Cover book={book} index={index} />
          <div className={styles.cardBody}><div className={styles.cardMeta}><span className={styles.genre}>{book.genre}</span><span className={styles.rating} aria-label={book.rating === null ? "Not rated" : `Rating: ${book.rating}`}><span aria-hidden="true">★</span> {book.rating ?? "—"}</span></div><h2 className={styles.bookTitle}>{book.title}</h2><p className={styles.author}>by {book.author}</p><div className={styles.review}><p className={styles.reviewLabel}>MY THOUGHTS</p><p className={styles.reviewText}>{book.review || "No review yet. Some stories need a little time to settle."}</p></div>{book.url && <a className={styles.notionLink} href={book.url} target="_blank" rel="noreferrer">Open in Notion ↗</a>}</div>
        </article>)}
      </div>}
      {!loading && shelf && filtered.length === 0 && <div className={styles.empty}><span className={styles.emptyIcon}>▤</span><h2>{books.length ? "No books on this little shelf." : "Your next chapter starts here."}</h2><p>{books.length ? "Try another search or genre, or explore the whole collection." : "Add a book to your Notion database, then refresh to see it here."}</p>{books.length > 0 && <button className={styles.connectButton} onClick={() => { setSearch(""); setGenre("All books"); setFavorites(false); }}>Show all books</button>}</div>}
      <footer className={styles.footer}><span>A home for the stories that make us.</span><span>Made for slow Sundays &amp; one more chapter. <span aria-hidden="true">✳</span></span></footer>
    </main>
    <dialog className={styles.dialog} ref={dialog} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }} aria-labelledby="connection-title">
      <div className={styles.dialogTop}><span className={styles.eyebrow}>YOUR BOOKS, YOUR SHELF</span><button className={styles.refreshButton} aria-label="Close connection guide" onClick={() => dialog.current?.close()}>×</button></div>
      <h2 className={styles.dialogTitle} id="connection-title">Connect your Notion.</h2><p className={styles.dialogIntro}>A one-time setup in your project. Keep your secret in the server’s environment file.</p>
      <ol className={styles.steps}>
        <li>Create an internal connection at <a href="https://www.notion.so/profile/integrations" target="_blank" rel="noreferrer">Notion’s integrations page ↗</a> with <strong>Read content</strong> access. Copy its integration secret.</li>
        <li>Open your books database in Notion. Under <strong>••• → Connections</strong>, add the connection you created.</li>
        <li>In the project’s <code>.env.local</code> file, add:<pre className={styles.codeBlock}>{"NOTION_API_KEY=your_integration_secret\nNOTION_DATABASE_ID=your_database_id"}</pre>Use the database’s 32-character ID from its link, without the <code>?v=…</code> view ID. For databases with multiple data sources, use <code>NOTION_DATA_SOURCE_ID</code> instead; find it under the data source’s menu → Manage data sources → Copy data source ID.</li>
        <li>Use these exact property names: <strong>Title</strong> (title), <strong>Author</strong> (text), <strong>Genre</strong> (select), <strong>Cover Image</strong> (files &amp; media or URL), <strong>Rating</strong> (number), and <strong>Review</strong> (text).</li>
        <li>Restart the development server with <code>npm run dev</code>, then refresh your shelf.</li>
      </ol><p className={styles.dialogFoot}>Every row is treated as a book you’ve read. Ratings display your exact numbers; Favorites includes ratings of 4.5 or higher.</p><button className={styles.connectButton} onClick={() => { dialog.current?.close(); void load(); }}>Refresh my shelf ↻</button>
    </dialog>
  </div>;
}
