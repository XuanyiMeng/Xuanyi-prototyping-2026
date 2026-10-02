/**
 * Root layout component that wraps all pages in the application.
 * This layout:
 * - Sets up Geist fonts (both Sans and Mono variants)
 * - Configures metadata like title and favicon
 * - Provides the basic HTML structure
 * - Applies font variables to the entire app
 */

import type { Metadata } from "next";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "SIA WORLD — Dot Pop Star",
  description: "Sia's virtual idol world: retro Seoul, Y2K shine, and vaporwave dreams.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✨</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
