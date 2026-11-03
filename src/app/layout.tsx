import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dongwoo Suk — Computational Design & AEC Technology",
  description: "Selected work in computational design, architectural geometry, Rhino.Inside.Revit, and AEC technology by Dongwoo Suk.",
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
