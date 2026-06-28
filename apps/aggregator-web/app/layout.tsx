import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Moja Buss",
    template: "%s | Moja Buss",
  },
  description: "Travel marketplace auth for passengers and operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
