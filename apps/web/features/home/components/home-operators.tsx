import Link from "next/link";
import { ArrowRight, Bus, Route, Star } from "lucide-react";
import { prefetch, trpc, HydrateClient } from "@/trpc/server";
import { HomeOperatorsClient } from "./home-operators-client";

export async function HomeOperators() {
  await prefetch(trpc.public.listOperators.queryOptions());

  return (
    <HydrateClient>
      <section className="py-32 px-6 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[#ee237c] text-xs uppercase font-extrabold tracking-widest block mb-3 bg-pink-50 px-3.5 py-1.5 rounded-full w-max mx-auto border border-pink-100/50">
              Trusted Partners
            </span>
            <h2
              className="text-slate-900 font-extrabold tracking-tight mb-4"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                lineHeight: 1.15,
              }}
            >
              Our Verified Bus Operators
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">
              We collaborate with the best transit companies to guarantee you excellence, comfort, and safety.
            </p>
          </div>

          <HomeOperatorsClient />

          {/* View all link */}
          <div className="text-center mt-12">
            <Link
              href="/operators"
              className="inline-flex items-center gap-2 text-[#ee237c] font-bold hover:gap-4 transition-all text-sm"
            >
              <span>View all operators</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </HydrateClient>
  );
}
