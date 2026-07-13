"use client";

import { Smartphone, Star } from "lucide-react";

// Inline SVG for Apple logo
function AppleLogo() {
  return (
    <svg viewBox="0 0 814 1000" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-167.2-21.8C79.8 774.7 10 554.8 10 431.2c0-226.6 147.3-346.3 282.7-346.3 74.3 0 136.7 48.8 183.7 48.8 44.8 0 115.7-51.6 198.5-51.6zm-234.8-191.5c37.9-45.3 65.1-108.2 65.1-171.1 0-8.9-.6-17.9-2.2-25.4-61.9 2.2-136.8 41.1-182.2 100.5-35.7 43.9-66.4 110.2-66.4 174.7 0 11.9 1.9 23.8 2.5 27.7 3.5.5 9.5 1.2 15.5 1.2 56 0 127.1-37.8 167.7-107.6z" />
    </svg>
  );
}

// Inline SVG for Google Play logo
function GooglePlayLogo() {
  return (
    <svg viewBox="0 0 512 512" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l236.6-238L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c17.4-9.5 17.4-35.5-.2-60.8zm-258.8 98.8l-165 165c.1.1.2.3.3.4l165-165z" />
    </svg>
  );
}

export function SearchPromoCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ee237c] via-rose-500 to-pink-400 p-6 shadow-lg shadow-pink-200/40 mb-4">
      {/* Background decorative circles */}
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -right-4 h-56 w-56 rounded-full bg-white/10" />
      <div className="absolute top-4 right-24 h-12 w-12 rounded-full bg-white/10" />

      <div className="relative flex items-start justify-between gap-4">
        {/* Left: text content */}
        <div className="flex-1">
          {/* Rating badge */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-3 w-3 fill-yellow-300 text-yellow-300" />
              ))}
            </div>
            <span className="text-white/80 text-xs font-semibold">4.9 · 12k reviews</span>
          </div>

          <h3 className="text-white font-extrabold text-xl leading-tight mb-1 font-montserrat">
            Travel smarter.
            <br />
            Book on the go.
          </h3>
          <p className="text-white/75 text-sm leading-relaxed mb-5 max-w-xs">
            Manage your tickets, boarding passes, and payments — even offline.
          </p>

          {/* Store buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-white text-slate-900 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-colors shadow-sm group"
              aria-label="Download on the App Store"
            >
              <AppleLogo />
              <div className="leading-none">
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Download on the</p>
                <p className="text-sm font-bold text-slate-900 -mt-0.5">App Store</p>
              </div>
            </a>

            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-white text-slate-900 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-colors shadow-sm group"
              aria-label="Get it on Google Play"
            >
              <GooglePlayLogo />
              <div className="leading-none">
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Get it on</p>
                <p className="text-sm font-bold text-slate-900 -mt-0.5">Google Play</p>
              </div>
            </a>
          </div>
        </div>

        {/* Right: phone icon decoration */}
        <div className="hidden sm:flex shrink-0 items-center justify-center w-24 h-24 mt-2">
          <div className="relative">
            {/* Phone outline */}
            <div className="w-14 h-24 rounded-2xl border-4 border-white/60 bg-white/20 backdrop-blur-sm flex flex-col items-center justify-between py-2 shadow-xl">
              {/* Speaker */}
              <div className="w-6 h-1 bg-white/50 rounded-full" />
              {/* Screen content mockup */}
              <div className="flex flex-col gap-1 w-full px-1.5">
                <div className="h-1.5 bg-white/50 rounded-full w-full" />
                <div className="h-1.5 bg-white/40 rounded-full w-3/4" />
                <div className="h-1.5 bg-white/30 rounded-full w-5/6" />
                <div className="mt-1 h-4 bg-white/60 rounded-lg w-full" />
              </div>
              {/* Home indicator */}
              <div className="w-6 h-1 bg-white/50 rounded-full" />
            </div>
            {/* Moja pink dot */}
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-white rounded-full flex items-center justify-center shadow">
              <Smartphone className="h-2.5 w-2.5 text-[#ee237c]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
