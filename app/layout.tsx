import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASHA Awaaz",
  description:
    "Voice-first visit logging for India's ASHA workers. She speaks her post-visit note in Hindi or Hinglish; it becomes a structured record. She never types.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
