import Image from "next/image";

export function HomeCta() {
  return (
    <section className="py-32 px-6 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto rounded-[3rem] bg-gradient-to-br from-[#ee237c] to-[#ee237c]/95 text-slate-800 relative overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[600px] shadow-2xl border border-slate-100">

          {/* Decorative ambient glow behind the phones */}
          <div className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-white/10 blur-3xl hidden lg:block" />

          {/* Left column: Sweeping white card layout */}
          <div className="bg-white p-10 md:p-20 lg:w-[55%] lg:rounded-r-[6rem] lg:rounded-l-[3rem] rounded-[3rem] relative z-10 flex flex-col justify-center items-start border-r border-slate-100/50">
            {/* Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 shadow-sm mb-6 select-none">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              100% Mobile Ticket Guarantee
            </div>

            {/* Heading */}
            <h2
                className="text-slate-900 font-extrabold tracking-tight mb-6"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "clamp(2rem, 4vw, 2.75rem)",
                  lineHeight: 1.1,
                }}
            >
              Travel in Your Pocket. <br className="hidden md:block" />
              Get the <span className="text-[#ee237c]">Moja-Bus</span> App!
            </h2>

            {/* Description */}
            <p className="text-slate-500 text-base leading-relaxed mb-10 max-w-lg">
              Download our top-rated app for the fastest way to search schedules, pick seats, pay securely via Mobile Money, and access your digital QR boarding passes anywhere.
            </p>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              {/* App Store */}
              <a
                  href="#"
                  className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
              >
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71,19.5 C17.88,20.74 17,21.95 15.66,21.97 C14.32,22 13.89,21.18 12.37,21.18 C10.84,21.18 10.37,21.95 9.1,22 C7.79,22.05 6.8,20.68 5.96,19.47 C4.25,17 2.94,12.45 4.7,9.39 C5.57,7.87 7.13,6.91 8.82,6.88 C10.1,6.86 11.32,7.75 12.11,7.75 C12.89,7.75 14.37,6.68 15.92,6.84 C16.57,6.87 18.39,7.1 19.56,8.82 C19.47,8.88 17.39,10.1 17.41,12.63 C17.44,15.65 20.06,16.66 20.1,16.67 C20.08,16.74 19.67,18.11 18.71,19.5 M15.97,4.17 C16.63,3.37 17.07,2.28 16.95,1 C15.98,1.04 14.8,1.65 14.1,2.47 C13.5,3.17 12.98,4.28 13.13,5.55 C14.21,5.63 15.31,5 15.97,4.17 Z" />
                </svg>
                <div className="text-left leading-none">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Download on the</span>
                  <span className="text-sm font-bold tracking-tight block mt-0.5">App Store</span>
                </div>
              </a>

              {/* Google Play */}
              <a
                  href="#"
                  className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
              >
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M5 3.5c-.2 0-.4.1-.5.3l10.3 10.3 3.3-3.3L5 3.5zm-1.2 1c-.2.2-.3.5-.3.8v13.4c0 .3.1.6.3.8L14 9.5 3.8 4.5zM15 10.5l4.1 4.1c.3.3.3.8 0 1.1l-3.3-3.3L15 10.5zm-.7-.7L4.1 20.1c.1.2.3.4.5.4h.4l12.7-7.1-3.4-3.6z" />
                </svg>
                <div className="text-left leading-none">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Get it on</span>
                  <span className="text-sm font-bold tracking-tight block mt-0.5">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Right column: bare, rotated, overlapping screenshots — no phone frame */}
          <div className="relative lg:w-[45%] flex items-center justify-center p-10 md:p-16 select-none z-10">
            <div className="relative w-full max-w-[420px] h-[520px]">
              {/* Booking Flow Screen — tilted back, offset left */}
              <div className="absolute left-0 top-6 w-[220px] h-[460px] -rotate-[10deg] rounded-[1.75rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.45)] ring-1 ring-white/20 transition-transform duration-500 hover:-translate-y-2 hover:-rotate-[13deg]">
                <Image
                    src="/home/app-screenshot-booking.jpg"
                    alt="Search schedules screen"
                    fill
                    className="object-cover"
                    sizes="220px"
                />
              </div>

              {/* QR Boarding Ticket Screen — tilted forward, offset right, layered on top */}
              <div className="absolute right-0 bottom-0 w-[220px] h-[460px] rotate-[8deg] rounded-[1.75rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.45)] ring-1 ring-white/20 transition-transform duration-500 hover:-translate-y-2 hover:rotate-[11deg] z-10">
                <Image
                    src="/home/app-screenshot-ticket.jpg"
                    alt="QR Boarding Pass screen"
                    fill
                    className="object-cover"
                    sizes="220px"
                />
              </div>
            </div>
          </div>

        </div>
      </section>
  );
}