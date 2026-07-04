import { Bus } from "lucide-react";

export function SearchHero() {
  return (
    <header className="bg-gradient-to-r from-pink-600 via-rose-500 to-[#ee237c] text-white py-12 px-4 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-pink-500/20 rounded-full blur-2xl -ml-20 -mb-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-montserrat flex items-center justify-center md:justify-start gap-2">
            <Bus className="h-10 w-10 animate-bounce" /> Moja Ride
          </h1>
          <p className="mt-2 text-pink-100 font-medium max-w-md">
            Book intercity bus tickets across Côte d'Ivoire. Swift, secure,
            and segment-aware travel booking.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md py-2 px-4 rounded-full border border-white/20 text-xs font-semibold uppercase tracking-wider">
          🇨🇮 100% Ivorian Bus Network
        </div>
      </div>
    </header>
  );
}