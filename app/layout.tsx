import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { SonnerHost } from "@/components/ui/SonnerHost";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lobe",
  description: "A personal OS for thought.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/*
        Critical fallback before globals.css hydrates — avoids white FOUC if CSS is slow/blocked.
        Matches app/globals.css --bg-0 / --text-primary.
      */}
      <body
        className="font-sans antialiased"
        style={{
          margin: 0,
          backgroundColor: "#0a0a0a",
          color: "#f0f0f0",
        }}
      >
        {children}
        <SonnerHost />
      </body>
    </html>
  );
}
