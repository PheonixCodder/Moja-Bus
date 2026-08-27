"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { HeroSearchBar } from "./hero-search-bar-2";

export function HomeHero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative min-h-[105vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/home/hero-bg.png"
          alt="Moja Ride Travel"
          fill
          priority
          className="w-full h-full object-cover"
          unoptimized
        />
        {/* Subtle light overlay to ensure text contrast if the image is too detailed */}
        <div className="absolute inset-0 bg-white/20" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 pt-24 pb-12">
        <div className="max-w-5xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-start mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/40 text-slate-800 shadow-sm text-sm font-medium">
              {t("badge")}
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-left text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.08] mb-4"
          >
            {t("titleLine1")}
            <span className="block text-slate-900">{t("titleLine2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-left text-slate-700 text-lg sm:text-xl mb-12 max-w-2xl font-medium"
          >
            {t("subtitle")}
          </motion.p>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white rounded-[2rem] shadow-2xl overflow-visible max-w-5xl"
          >
            <HeroSearchBar />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
