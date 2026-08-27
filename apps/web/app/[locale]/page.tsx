import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
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
import { HomeReferralCapture } from "@/features/discounts/components/home-referral-capture";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("ogTitle"),
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: ["/home/_.jpg"],
    },
    alternates: {
      languages: {
        en: "/",
        fr: "/fr",
        "x-default": "/",
      },
    },
  };
}

export default async function HomePage() {
  const session = await getServerSession();

  return (
    <div className="overflow-x-hidden">
      <Suspense fallback={null}>
        <HomeReferralCapture />
      </Suspense>
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
