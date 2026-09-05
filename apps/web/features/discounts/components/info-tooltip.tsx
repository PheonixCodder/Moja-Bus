"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@moja/ui/components/ui/tooltip";
import { Info } from "lucide-react";
import * as React from "react";
import { useTranslations } from "next-intl";

type InfoTooltipProps = {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
};

/**
 * Modern Apple / Upwork-grade minimalist info tooltip for forms & dashboard metrics.
 */
export function InfoTooltip({
  content,
  side = "top",
  className,
  iconClassName,
}: InfoTooltipProps) {
  const t = useTranslations("discounts.infoTooltip");

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        tabIndex={-1}
        className={`inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          className ?? ""
        }`}
        aria-label={t("ariaLabel")}
      >
        <Info className={`size-3.5 ${iconClassName ?? ""}`} />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={6}
        className="max-w-xs rounded-lg border border-border bg-popover px-3 py-2 text-xs font-normal leading-relaxed text-popover-foreground shadow-xl backdrop-blur-sm"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
