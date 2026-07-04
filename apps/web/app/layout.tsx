import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "Moja Ride",
    template: "%s | Moja Ride",
  },
  description: "Travel marketplace auth for passengers and operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <TRPCReactProvider>
          <NuqsAdapter>
            <Toaster />
            {children}
          </NuqsAdapter>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
