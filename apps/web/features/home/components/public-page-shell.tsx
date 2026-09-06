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
    <div className="min-h-screen bg-background">
      {/* Modern page title hero section */}
      <div className="relative bg-card text-card-foreground py-24 px-6 md:px-8 overflow-hidden border-b border-border select-none">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary rounded-full blur-[110px] opacity-15 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {badge && (
            <span className="inline-block px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-primary/20">
              {badge}
            </span>
          )}
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{
              fontFamily: "var(--font-heading)",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Content body */}
      <div className="bg-background">{children}</div>
    </div>
  );
}
