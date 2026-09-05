import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Globe, Mail, Camera } from "lucide-react";

const serviceLinks = [
  { key: "bookBus", href: "/search" },
  { key: "vipDestinations", href: "/search" },
  { key: "corporateOffers", href: "/contact" },
  { key: "becomePartner", href: "/become-a-partner" },
] as const;

const supportLinks = [
  { key: "helpCenter", href: "/help" },
  { key: "paymentSecurity", href: "/help#payment" },
  { key: "cancellations", href: "/help#cancellations" },
  { key: "contactUs", href: "/contact" },
] as const;

const companyLinks = [
  { key: "aboutMojaRide", href: "/about" },
  { key: "ourOperators", href: "/operators" },
  { key: "termsOfUse", href: "/terms" },
  { key: "privacyPolicy", href: "/privacy" },
] as const;

const socials = [
  { icon: Globe, href: "https://mojaride.com", label: "Website" },
  { icon: Mail, href: "mailto:support@mojaride.com", label: "Email" },
  {
    icon: Camera,
    href: "https://www.instagram.com/mojaride",
    label: "Instagram",
  },
] as const;

export async function HomeFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="bg-card border-t border-border pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          {/* Brand */}
          <div className="col-span-1">
            <Link
              href="/"
              className="text-2xl font-bold text-primary block mb-5"
            >
              Moja Ride
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              {t("brandDescription")}
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-foreground mb-6">{t("services")}</h4>
            <ul className="space-y-4">
              {serviceLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-foreground mb-6">{t("support")}</h4>
            <ul className="space-y-4">
              {supportLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-foreground mb-6">{t("company")}</h4>
            <ul className="space-y-4">
              {companyLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground/70">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-8">
            {[
              { key: "termsOfUse", href: "/terms" },
              { key: "privacyPolicy", href: "/privacy" },
            ].map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="text-xs font-bold text-muted-foreground/70 hover:text-primary transition-colors"
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
