import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cerulean — Thinking Workspace",
  description:
    "Turn AI conversations into structured documents without losing the thinking behind them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
