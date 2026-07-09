import { Search, SlidersHorizontal, Armchair, Wallet, QrCode } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Search",
    description: "Enter departure, destination, and travel dates.",
  },
  {
    number: "02",
    icon: SlidersHorizontal,
    title: "Select",
    description: "Compare schedules, amenities, and bus operators.",
  },
  {
    number: "03",
    icon: Armchair,
    title: "Choose Seat",
    description: "View the seating chart and select your exact seat.",
  },
  {
    number: "04",
    icon: Wallet,
    title: "Secure Pay",
    description: "Complete booking instantly via Mobile Money or card.",
  },
  {
    number: "05",
    icon: QrCode,
    title: "Board Bus",
    description: "Receive your QR ticket via SMS/email and skip the queue.",
  },
];

export function HomeHowItWorks() {
  return (
    <section className="py-32 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[#ee237c] text-xs uppercase font-extrabold tracking-widest block mb-3 bg-pink-50 px-3.5 py-1.5 rounded-full w-max mx-auto border border-pink-100/50">
            Workflow
          </span>
          <h2
            className="text-slate-900 font-extrabold tracking-tight mb-4"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              lineHeight: 1.15,
            }}
          >
            Your Journey in <span className="text-[#ee237c]">5 Simple Steps</span>
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Follow our simplified intercity timeline to secure your seat and board with peace of mind.
          </p>
        </div>

        {/* Stepper Timeline Container */}
        <div className="relative grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-6">
          {/* Vertical connector line (mobile only) */}
          <div className="absolute left-[39px] top-10 bottom-10 w-0.5 border-l-2 border-dashed border-slate-100 z-0 md:hidden" />
          
          {/* Horizontal connector line (desktop only) */}
          <div className="absolute top-[54px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-slate-100 z-0 hidden md:block" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative flex flex-row md:flex-col items-start md:items-center gap-6 md:gap-0 group z-10">
                {/* Circle & Background Number Container */}
                <div className="relative shrink-0 md:mb-6">
                  {/* Large background step number */}
                  <span className="text-5xl md:text-7xl font-black text-slate-100/60 select-none absolute -top-4 -left-3 md:-top-7 md:left-1/2 md:-translate-x-1/2 z-0 leading-none group-hover:text-pink-50/70 transition-colors duration-300">
                    {step.number}
                  </span>
                  {/* Circular Icon container */}
                  <div className="w-20 h-20 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center relative shadow-sm z-10 group-hover:border-[#ee237c] group-hover:shadow-md transition-all duration-300">
                    <Icon className="h-8 w-8 text-[#ee237c]/70 group-hover:text-[#ee237c] group-hover:scale-110 transition-all duration-300" />
                  </div>
                </div>

                {/* Text Content */}
                <div className="pt-3 md:pt-0 md:text-center">
                  <h4 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-[#ee237c] transition-colors duration-300">
                    {step.title}
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-[200px] md:max-w-[150px]">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
