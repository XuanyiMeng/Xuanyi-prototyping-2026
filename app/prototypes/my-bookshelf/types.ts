export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  cover: string | null;
  rating: number | null;
  review: string;
  url: string | null;
}

export interface ShelfResponse {
  mode: "demo" | "notion";
  books: Book[];
  warning?: string;
}
