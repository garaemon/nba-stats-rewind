import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TimezoneProvider } from "@/components/TimezoneProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NBA Stats Rewind",
  description: "Relive the action, play by play.",
  keywords: ["NBA", "Stats", "Rewind", "Avoid spoilers", "No spoilers", "Spoiler-free"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TimezoneProvider>
          {children}
        </TimezoneProvider>
      </body>
    </html>
  );
}
