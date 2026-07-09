import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth-server";
import { HomeHeader } from "@/features/home/components/home-header";
import { HomeHero } from "@/features/home/components/home-hero";
import { HomeDestinations } from "@/features/home/components/home-destinations";
import { HomeFeatures } from "@/features/home/components/home-features";
import { HomeOperators } from "@/features/home/components/home-operators";
import { HomeHowItWorks } from "@/features/home/components/home-how-it-works";
import { HomeTestimonials } from "@/features/home/components/home-testimonials";
import { HomeCta } from "@/features/home/components/home-cta";
import { HomeFooter } from "@/features/home/components/home-footer";

export const metadata: Metadata = {
  title: "Moja Ride | The adventure starts with a ticket",
  description:
    "Discover Côte d'Ivoire with the best intercity bus service. Search, book, and travel with comfort and peace of mind.",
  openGraph: {
    title: "Moja Ride | The adventure starts with a ticket",
    description:
      "Book intercity bus tickets across Côte d'Ivoire — fast, safe, comfortable.",
    images: ["/home/_.jpg"],
  },
};

export default async function HomePage() {
  const session = await getServerSession();

  return (
    <div className="overflow-x-hidden">
      <HomeHeader user={session?.user} />
      <main>
        <HomeHero />
        <HomeDestinations />
        <HomeFeatures />
        <HomeOperators />
        <HomeHowItWorks />
        <HomeTestimonials />
        <HomeCta />
      </main>
      <HomeFooter />
    </div>
  );
}