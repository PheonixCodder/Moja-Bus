"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

const PAYMENT_METHODS = [
  {
    id: "wave",
    label: "Wave",
    render: <img src="/home/wave.png" alt="Wave" className="h-5 w-auto" />,
  },
  {
    id: "mtn",
    label: "MTN",
    render: <img src="/home/mtn.png" alt="MTN" className="h-5 w-auto" />,
  },
  {
    id: "orange",
    label: "Orange Money",
    render: (
      <img src="/home/orange.png" alt="Orange Money" className="h-5 w-auto" />
    ),
  },
  {
    id: "moov",
    label: "Moov",
    render: <img src="/home/moov.png" alt="Moov" className="h-5 w-auto" />,
  },
  {
    id: "mastercard",
    label: "Mastercard",
    render: (
      <span className="flex items-center">
        <span className="w-4 h-4 rounded-full bg-[#EB001B]" />
        <span className="w-4 h-4 -ml-1.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    ),
  },
  {
    id: "visa",
    label: "Visa",
    render: (
      <span className="font-black italic text-[15px] tracking-tight text-[#1A1F71]">
        VISA
      </span>
    ),
  },
];

export function TrustBar() {
  const t = useTranslations("trustbar");
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative rounded-2xl px-5 py-4 md:px-8 md:py-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
          {/* Payment methods */}
          <div className="flex items-center gap-4 md:gap-5 shrink-0 md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              {t("securePay")}
            </span>
            <div className="flex items-center gap-3.5">
              {PAYMENT_METHODS.map((m) => (
                <div
                  key={m.id}
                  title={m.label}
                  className="flex items-center opacity-70 hover:opacity-100 transition-opacity duration-150"
                >
                  {m.render}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
