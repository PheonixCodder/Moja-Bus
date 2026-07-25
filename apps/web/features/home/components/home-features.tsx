"use client";

import { useTranslations } from "next-intl";
import { Armchair, Wallet, Smartphone, ShieldCheck } from "lucide-react";

const FEATURE_KEYS = [
  { key: "seatSelection", icon: Armchair },
  { key: "mobileMoney", icon: Wallet },
  { key: "qrBoarding", icon: Smartphone },
  { key: "verifiedOperators", icon: ShieldCheck },
] as const;

export function HomeFeatures() {
  const t = useTranslations("landing.features");

  return (
    <section className="py-32 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[#ee237c] text-xs uppercase font-extrabold tracking-widest block mb-3 bg-pink-50 px-3.5 py-1.5 rounded-full w-max mx-auto border border-pink-100/50">
            {t("badge")}
          </span>
          <h2
            className="text-slate-900 font-extrabold tracking-tight mb-4"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              lineHeight: 1.15,
            }}
          >
            {t.rich("title", {
              span: (chunks) => <span className="text-[#ee237c]">{chunks}</span>,
            })}
          </h2>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FEATURE_KEYS.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start"
            >
              {/* Icon Container */}
              <div className="w-16 h-16 shrink-0 bg-[#ee237c]/5 text-[#ee237c] rounded-2xl flex items-center justify-center group-hover:bg-[#ee237c] group-hover:text-white transition-colors duration-300 shadow-sm">
                <Icon className="h-7 w-7" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {t(`${key}.title`)}
                  </h3>
                  <span className="px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-[#ee237c]/5 text-[#ee237c] rounded-full">
                    {t(`${key}.badge`)}
                  </span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {t(`${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
