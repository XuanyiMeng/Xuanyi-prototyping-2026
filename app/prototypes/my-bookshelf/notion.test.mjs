import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Compile only the server adapter in memory; no framework or live credentials needed.
const source = await readFile(new URL('./notion.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { loadBooks, mapBook, safeUrl } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const sourceId = '0123456789abcdef0123456789abcdef';
const schema = { properties: Object.fromEntries(Object.entries({ Title: 'title', Author: 'rich_text', Genre: 'select', 'Cover Image': 'files', Rating: 'number', Review: 'rich_text' }).map(([name, type]) => [name, { type }])) };
const page = { object: 'page', id: 'book-1', url: 'https://www.notion.so/book-1', properties: { Title: { title: [{ plain_text: 'A book' }] }, Author: { rich_text: [{ plain_text: 'An author' }] }, Genre: { select: { name: 'Fiction' } }, 'Cover Image': { type: 'files', files: [{ type: 'file', file: { url: 'https://example.com/cover.png' } }] }, Rating: { number: 0 }, Review: { rich_text: [{ plain_text: 'First line\n' }, { plain_text: 'Second line' }] } } };

test('maps all six fields, preserves zero ratings, rejects unsafe URLs, and handles empty rows', () => {
  const book = mapBook(page);
  assert.equal(book.title, 'A book'); assert.equal(book.author, 'An author'); assert.equal(book.genre, 'Fiction');
  assert.equal(book.cover, 'https://example.com/cover.png'); assert.equal(book.rating, 0); assert.equal(book.review, 'First line\nSecond line');
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(mapBook({ object: 'page', id: 'empty', properties: {} }).rating, null);
  assert.equal(mapBook({ ...page, properties: { ...page.properties, 'Cover Image': { type: 'url', url: 'https://example.com/image.jpg' } } }).cover, 'https://example.com/image.jpg');
});

test('uses demo mode only when completely unconfigured', async () => {
  assert.equal((await loadBooks({})).mode, 'demo');
  await assert.rejects(loadBooks({ token: 'test-secret' }), /Finish setup/);
});

test('discovers the source, sends current headers, paginates opaque cursors, and warns on incomplete results', async () => {
  const original = globalThis.fetch;
  const calls = [];
  const responses = [{ data_sources: [{ id: sourceId }] }, schema, { results: [page], has_more: true, next_cursor: 'opaque/cursor+value=', request_status: { type: 'incomplete' } }, { results: [{ ...page, id: 'book-2' }, { ...page, id: 'trash', in_trash: true }], has_more: false }];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json(responses.shift()); };
  try {
    const result = await loadBooks({ token: 'test-secret', databaseId: sourceId });
    assert.equal(result.books.length, 2); assert.ok(result.warning); assert.equal(result.mode, 'notion');
    assert.ok(calls[2].url.endsWith(`/data_sources/${sourceId}/query`));
    assert.equal(calls[2].options.headers['Notion-Version'], '2026-03-11');
    assert.equal(JSON.parse(calls[3].options.body).start_cursor, 'opaque/cursor+value=');
  } finally { globalThis.fetch = original; }
});

test('reports schema, access, and ambiguous-source errors without falling back to samples', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ data_sources: [{ id: sourceId }, { id: sourceId }] });
    await assert.rejects(loadBooks({ token: 'test', databaseId: sourceId }), /multiple data sources/);
    globalThis.fetch = async () => Response.json({ properties: {} });
    await assert.rejects(loadBooks({ token: 'test', dataSourceId: sourceId }), /Title: title/);
    globalThis.fetch = async () => Response.json({}, { status: 404 });
    await assert.rejects(loadBooks({ token: 'test', dataSourceId: sourceId }), /Connections menu/);
  } finally { globalThis.fetch = original; }
});
