import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthStateWrapper from "@/components/AuthStateWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NSA ULM - Nepalese Student Association",
  description: "Official website of the Nepalese Student Association at the University of Louisiana Monroe",
  manifest: "/images/site.webmanifest",
  icons: {
    icon: "/images/favicon.ico",
    apple: "/images/apple-touch-icon.png",
    shortcut: "/images/favicon-32x32.png",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/images/favicon-16x16.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/images/favicon-32x32.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        url: "/images/apple-touch-icon.png",
      },
      {
        rel: "android-chrome",
        sizes: "192x192",
        url: "/images/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome",
        sizes: "512x512",
        url: "/images/android-chrome-512x512.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" type="image/x-icon" href="/images/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
        <link rel="manifest" href="/images/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <main className="min-h-screen bg-background">
          <AuthStateWrapper>
            {children}
          </AuthStateWrapper>
        </main>
      </body>
    </html>
  );
}
