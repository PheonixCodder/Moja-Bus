import { getTranslations } from "next-intl/server";
import { Star, ShieldCheck } from "lucide-react";

const testimonials = [
  {
    name: "Fatou Kamara",
    initials: "FK",
    gradient: "from-primary to-pink-500",
    route: "Abidjan → Bouaké",
    quote:
      "Booking was incredibly fast! I paid securely via Wave and received my QR boarding ticket via SMS and email within 30 seconds. No more standing in queues at the station.",
    date: "2 days ago",
  },
  {
    name: "Koffi Yao",
    initials: "KY",
    gradient: "from-indigo-500 to-purple-600",
    route: "Yamoussoukro → Abidjan",
    quote:
      "Excellent customer support. I had to reschedule my trip last minute. The customer service agent helped me switch buses quickly, and the process was absolutely seamless.",
    date: "1 week ago",
  },
  {
    name: "Awa Diaby",
    initials: "AD",
    gradient: "from-emerald-400 to-teal-600",
    route: "San-Pédro → Abidjan",
    quote:
      "I love that I can select my exact seat! I prefer sitting near the window, and Moja-Bus allows me to inspect the seating chart and choose my spot before paying.",
    date: "3 days ago",
  },
];

export async function HomeTestimonials() {
  const t = await getTranslations("testimonials");

  return (
    <section className="py-32 px-6 md:px-8 bg-background relative overflow-hidden border-t border-b border-border">
      {/* Background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-primary text-xs uppercase font-extrabold tracking-widest block mb-3 bg-primary/10 px-3.5 py-1.5 rounded-full w-max mx-auto border border-primary/20">
            {t("badge")}
          </span>
          <h2
            className="text-foreground font-extrabold tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              lineHeight: 1.15,
            }}
          >
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((review) => (
            <div
              key={review.name}
              className="bg-card p-8 md:p-10 rounded-[2.5rem] border border-border shadow-sm flex flex-col justify-between relative group hover:shadow-md hover:-translate-y-1.5 hover:border-primary/20 transition-all duration-300"
            >
              {/* Decorative Quote Bubble Mark (positioned in the background) */}
              <div className="absolute top-8 left-8 text-muted/30 group-hover:text-primary/10 transition-colors duration-300 -z-0">
                <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24">
                  <path d="M11.192 15.757c0-.954-.233-1.908-.7-2.862a9.19 9.19 0 0 0-2.1-2.862c-.933-.954-2.1-1.614-3.5-1.98L4 9.387c1.4.366 2.333 1.026 2.8 1.98.467.954.7 1.908.7 2.862H4v7h7.192v-5.73zM20 15.757c0-.954-.233-1.908-.7-2.862a9.19 9.19 0 0 0-2.1-2.862c-.933-.954-2.1-1.614-3.5-1.98l-.8 1.34c1.4.366 2.333 1.026 2.8 1.98.467.954.7 1.908.7 2.862H13v7h7v-5.73z" />
                </svg>
              </div>

              {/* Green Verified Pill in corner */}
              <div className="absolute top-8 right-8 flex items-center gap-1 bg-success/10 text-success px-3 py-1 rounded-full text-[10px] font-bold border border-success/20 shadow-sm select-none z-10">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("verified")}
              </div>

              <div className="relative z-10">
                {/* Gold Stars */}
                <div className="flex items-center gap-1 mb-6 text-warning">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4.5 w-4.5 fill-current" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-foreground/90 text-sm md:text-[14.5px] leading-relaxed mb-8 italic">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>

              {/* User Bio */}
              <div className="flex items-center gap-4 border-t border-border pt-6 mt-auto relative z-10">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${review.gradient} text-white font-extrabold flex items-center justify-center text-sm shadow-sm select-none group-hover:ring-4 group-hover:ring-primary/10 transition-all duration-300`}
                >
                  {review.initials}
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-foreground text-[14.5px]">
                    {review.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-primary font-bold tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {review.route}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      • {review.date}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trustpilot Trust Bar */}
        <div className="mt-32 flex justify-center">
          <div className="bg-muted/40 border border-border shadow-sm hover:shadow-md transition-shadow duration-300 rounded-[2rem] px-8 py-6 flex flex-col md:flex-row items-center gap-6 md:gap-10 select-none">
            {/* Trustpilot Logo */}
            <div className="flex items-center gap-2 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-10">
              <svg
                className="w-8 h-8 text-success fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <span
                className="font-black text-2xl tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Trustpilot
              </span>
            </div>

            {/* Trustpilot Stars */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className="w-8 h-8 bg-success text-success-foreground flex items-center justify-center rounded-md shadow-sm"
                >
                  <Star className="h-4.5 w-4.5 fill-current" />
                </div>
              ))}
            </div>

            {/* Trustpilot Stats */}
            <div className="text-sm text-muted-foreground flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="font-extrabold text-foreground text-base">
                {t("trustpilot.trustScore")}
              </span>
              <span className="hidden md:inline text-border">|</span>
              <span>
                {t.rich("trustpilot.basedOn", {
                  count: "12,450+",
                  strong: (chunks) => (
                    <span className="font-bold text-foreground">{chunks}</span>
                  ),
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
