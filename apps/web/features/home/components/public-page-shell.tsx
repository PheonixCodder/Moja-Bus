import React from "react";

export function PublicPageShell({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Modern page title hero section */}
      <div className="relative bg-slate-950 text-white py-24 px-6 md:px-8 overflow-hidden border-b border-slate-900 select-none">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ee237c] rounded-full blur-[110px] opacity-15 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {badge && (
            <span className="inline-block px-3.5 py-1.5 bg-[#ee237c]/10 text-[#ee237c] rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-[#ee237c]/20">
              {badge}
            </span>
          )}
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{
              fontFamily: "Montserrat, sans-serif",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Content body */}
      <div className="bg-white">
        {children}
      </div>
    </div>
  );
}
