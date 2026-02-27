import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuestCal — TTRPG Session Scheduling",
  description:
    "Schedule TTRPG sessions across multiple campaigns with overlapping players.",
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
