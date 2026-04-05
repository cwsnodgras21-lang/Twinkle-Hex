import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twinkle & Hex | Indie Nail Polish",
  description: "Handcrafted indie nail polish for the bold and creative.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
