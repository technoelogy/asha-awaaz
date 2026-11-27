import type { Metadata, Viewport } from "next";
import AshaAwaazApp from "../AshaAwaazApp";
import "../asha-awaaz.css";

export const metadata: Metadata = {
  title: "ASHA Awaaz | Voice-first visit logging",
  description:
    "Voice-first visit logging for India's ASHA workers. She speaks her post-visit note in Hindi or Hinglish; it becomes a structured PHC record. She never types.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#003153",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function AshaAwaazPage() {
  return <AshaAwaazApp />;
}
