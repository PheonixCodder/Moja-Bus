"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";

interface LocaleSwitcherProps {
  className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("locale");

  const switchLocale = (next: string) => {
    router.replace(pathname, { locale: next });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 text-sm font-medium", className)}
          aria-label="Switch language"
        >
          <Globe className="size-4 shrink-0" />
          <span className="hidden sm:inline">{t("current")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem
          onClick={() => switchLocale("en")}
          className={locale === "en" ? "font-semibold text-primary" : ""}
        >
          🇬🇧 {t("en")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("fr")}
          className={locale === "fr" ? "font-semibold text-primary" : ""}
        >
          🇫🇷 {t("fr")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
