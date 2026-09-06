import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/features/contact/components/contact-form";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Contact Us — Moja Ride",
  description:
    "Get in touch with the Moja Ride team. We're available 24/7 to answer your questions.",
};

const info = [
  { icon: Phone, key: "Phone", color: "bg-info/10 text-info" },
  { icon: Mail, key: "Email", color: "bg-primary/10 text-primary" },
  { icon: MapPin, key: "Office", color: "bg-success/10 text-success" },
  { icon: Clock, key: "Hours", color: "bg-warning/10 text-warning" },
] as const;

const steps = ["1", "2", "3"] as const;

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <PublicPageShell
      title={t("shellTitle")}
      description={t("shellDescription")}
      badge={t("shellBadge")}
    >
      {/* Contact info cards */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {info.map(({ icon: Icon, key, color }) => (
            <div
              key={key}
              className="bg-card border border-border rounded-3xl p-6 hover:shadow-md transition-all"
            >
              <div
                className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-card-foreground mb-2">
                {t(`info${key}`)}
              </h3>
              <p className="text-sm font-semibold text-foreground">
                {t(`info${key}Line1`)}
              </p>
              <p className="text-sm text-muted-foreground">{t(`info${key}Line2`)}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2
              className="text-foreground mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 700,
              }}
            >
              {t("formTitle")}
            </h2>
            <p className="text-muted-foreground mb-8">{t("formDescription")}</p>
            <ContactForm />
          </div>

          {/* What to expect */}
          <div className="bg-muted/40 rounded-3xl p-8 border border-border">
            <h3 className="font-bold text-foreground text-lg mb-6">
              {t("expectTitle")}
            </h3>
            <div className="space-y-5">
              {steps.map((step) => (
                <div key={step} className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {step}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      {t(`step${step}Title`)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t(`step${step}Description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
