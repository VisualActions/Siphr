import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siphr — code hosting that can't read your code",
  description:
    "End-to-end encrypted git hosting. Per-repo keys, wrapped to collaborator public keys, never to us. Zero-knowledge by design.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
