import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My bookshelf — A reading collection",
  description: "A personal reading gallery with books, reviews, and little worlds, powered by Notion.",
};

export default function BookshelfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
