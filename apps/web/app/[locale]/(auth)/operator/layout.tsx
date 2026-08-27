import type { ReactNode } from "react";
import { Command } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "next-intl/server";

export default async function OperatorAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("auth.operator.cover");

  return (
    <main className="min-h-screen bg-bg-surface">
      <div className="absolute top-4 right-4 z-50">
        <LocaleSwitcher />
      </div>
      <div className="grid min-h-screen justify-center p-2 lg:grid-cols-2">
        {/* Right Cover Column (Desktop only) */}
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex flex-col justify-between p-12 text-white">
          <div className="space-y-2">
            <Command className="size-10 text-white" />
            <h1 className="font-bold text-3xl tracking-tight">{t("title")}</h1>
            <p className="text-sm opacity-90 max-w-md">{t("subtitle")}</p>
          </div>

          <div className="flex gap-6 pt-10 border-t border-white/20">
            <div className="flex-1 space-y-1">
              <h2 className="font-bold text-sm">{t("feature1Title")}</h2>
              <p className="text-xs opacity-80 leading-relaxed">
                {t("feature1Desc")}
              </p>
            </div>
            <div className="w-[1px] bg-white/20 h-auto" />
            <div className="flex-1 space-y-1">
              <h2 className="font-bold text-sm">{t("feature2Title")}</h2>
              <p className="text-xs opacity-80 leading-relaxed">
                {t("feature2Desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Left Form Column */}
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
