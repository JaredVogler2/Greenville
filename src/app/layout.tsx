import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Charleston Home Search & Analysis",
  description:
    "Objective financial, commute, flood and lifestyle analysis of Charleston-metro homes for a family relocating from Greenville, SC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
