import type { Book } from "./types";

// These are example entries, not records from the reader's Notion database.
export const demoBooks: Book[] = [
  { id: "demo-1", title: "The Creative Act", author: "Rick Rubin", genre: "Creativity", rating: 5, review: "A gentle reminder that creativity is a way of moving through the world. One to keep within arm’s reach and return to often." },
  { id: "demo-2", title: "Normal People", author: "Sally Rooney", genre: "Fiction", rating: 4, review: "So much lives in what goes unsaid. Tender, complicated, and full of moments that felt almost too familiar." },
  { id: "demo-3", title: "The Psychology of Money", author: "Morgan Housel", genre: "Nonfiction", rating: 4.5, review: "Less about spreadsheets, more about being human. A thoughtful look at the stories we tell ourselves about enough." },
  { id: "demo-4", title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", rating: 4, review: "A comforting little exploration of all the lives we could have lived, and the possibility in the one we already have." },
  { id: "demo-5", title: "Devotions", author: "Mary Oliver", genre: "Poetry", rating: 5, review: "An invitation to slow down and notice. I finished this wanting to spend more time outdoors, paying attention to small things." },
  { id: "demo-6", title: "Ways of Seeing", author: "John Berger", genre: "Art & design", rating: 4.5, review: "A short book that changes the way you look. The questions about images, ownership, and perspective stayed with me." },
].map(book => ({ ...book, cover: null, url: null }));
