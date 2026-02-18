import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono, Inter } from "next/font/google";
import { ThemeSync } from "@/components/ThemeSync";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const modernFont = Inter({
  subsets: ["latin"],
  variable: "--font-modern",
});

export const metadata: Metadata = {
  title: "Dope Wars",
  description: "The classic drug trading game — reimagined for the web",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pixelFont.variable} ${monoFont.variable} ${modernFont.variable} antialiased`}>
        <ThemeSync />
        <div className="crt-overlay" />
        {children}
      </body>
    </html>
  );
}
