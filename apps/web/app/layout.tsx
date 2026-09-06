// Root layout — required by Next.js 16 to define <html> and <body>.
// Locale-specific providers and lang-attribution are handled in [locale]/layout.tsx.
// suppressHydrationWarning is set on <html> because the lang attribute is
// set dynamically on the client via a LangSetter component.

import { Outfit, Raleway } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${raleway.variable} style-maia h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
