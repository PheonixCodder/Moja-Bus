"use client";

import { History, ArrowRight, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

const PAYMENT_METHODS = [
    {
        id: "mpesa",
        label: "M-PESA",
        render: (
            <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[#4CAF50]" />
        <span className="font-extrabold tracking-tight text-[13px] text-[#1a7a37]">
          M-PESA
        </span>
      </span>
        ),
    },
    {
        id: "airtel",
        label: "Airtel Money",
        render: (
            <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-[#ED1C24] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
        <span className="font-bold text-[13px] text-[#ED1C24] tracking-tight">
          airtel <span className="font-medium text-[10px] text-slate-400 align-super">money</span>
        </span>
      </span>
        ),
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
    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="relative rounded-2xl px-5 py-4 md:px-8 md:py-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
                    {/* Payment methods */}
                    <div className="flex items-center gap-4 md:gap-5 shrink-0 md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              Secure pay
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