import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, TrendingUp } from "lucide-react";

const DESTINATIONS_DATA = [
  {
    key: "yamoussoukro",
    name: "Yamoussoukro",
    image: "/home/destination-yamoussoukro.jpg",
    badgeKey: "yamoussoukroBadge",
    badgeStyle: "bg-[#ee237c] text-white border border-[#ee237c]/10",
    href: "/search?to=yamoussoukro",
    gridClass: "md:col-span-2 md:row-span-2 min-h-[320px]",
    titleSize: "text-3xl md:text-4xl",
    imgSizes: "(max-width: 768px) 100vw, 50vw",
  },
  {
    key: "sanPedro",
    name: "San-Pédro",
    image: "/home/destination-san-pedro.jpg",
    badgeKey: "sanPedroBadge",
    badgeStyle: "bg-white/25 backdrop-blur-md text-white border border-white/10",
    href: "/search?to=san-pedro",
    gridClass: "md:col-span-2 min-h-[220px]",
    titleSize: "text-2xl",
    imgSizes: "(max-width: 768px) 100vw, 50vw",
  },
  {
    key: "plateau",
    name: "Plateau",
    image: "/home/destination-abidjan.jpg",
    badgeKey: null,
    badgeStyle: "",
    href: "/search?to=abidjan",
    gridClass: "min-h-[220px] md:min-h-auto",
    titleSize: "text-xl",
    imgSizes: "(max-width: 768px) 100vw, 25vw",
  },
] as const;

export async function HomeDestinations() {
  const t = await getTranslations("destinations");

  return (
    <section className="py-32 px-6 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2
              className="text-slate-900 font-extrabold tracking-tight"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                lineHeight: 1.15,
              }}
            >
              {t("title")}
            </h2>
            <p className="text-slate-500 text-sm md:text-base mt-3 leading-relaxed">{t("subtitle")}</p>
          </div>
          <Link
            href="/search"
            className="hidden md:flex items-center gap-2 text-[#ee237c] font-bold hover:gap-4 transition-all duration-300 text-sm"
          >
            <span>{t("exploreAll")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[660px]">
          {DESTINATIONS_DATA.map((dest) => (
            <Link
              key={dest.key}
              href={dest.href}
              className={`${dest.gridClass} relative rounded-[2rem] overflow-hidden group cursor-pointer block shadow-sm hover:shadow-2xl transition-all duration-500`}
            >
              <Image
                src={dest.image}
                alt={dest.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes={dest.imgSizes}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-95" />
              
              {dest.badgeKey && (
                <div className="absolute top-6 left-6 z-10">
                  <span className={`px-3.5 py-1.5 ${dest.badgeStyle} text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm`}>
                    {t(dest.badgeKey)}
                  </span>
                </div>
              )}
              
              <div className="absolute bottom-8 left-8 right-8 text-white z-10">
                <h3 className={`${dest.titleSize} font-bold mb-1 tracking-tight`}>
                  {dest.name}
                </h3>
                <p className="text-white/70 text-sm font-medium">{t(dest.key)}</p>
              </div>

              {/* Premium Hover CTA */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <span className="px-6 py-3.5 bg-white text-slate-900 font-extrabold rounded-2xl shadow-2xl text-xs flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  {t("searchNow")} <ArrowRight className="h-4 w-4 text-[#ee237c]" />
                </span>
              </div>
            </Link>
          ))}

          {/* CTA card */}
          <Link
            href="/search"
            className="relative rounded-[2rem] overflow-hidden cursor-pointer block min-h-[220px] md:min-h-auto bg-[#ee237c] p-8 flex flex-col justify-between group hover:bg-[#d01867] shadow-sm hover:shadow-2xl transition-all duration-300"
          >
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white/95">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="text-white mt-8 md:mt-0">
              <h3 className="text-xl font-bold mb-2">{t("tailorMade")}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{t("tailorMadeDesc")}</p>
              <div className="mt-4 flex items-center gap-2 text-white font-extrabold text-sm">
                <span>{t("searchNow")}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
