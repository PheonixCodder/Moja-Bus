"use client";

import { Printer } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { useTranslations } from "next-intl";
import { cn } from "@moja/ui/lib/utils";
import type { ComponentProps } from "react";

interface PrintTicketButtonProps extends ComponentProps<typeof Button> {
  translationNamespace?: "ticket" | "passengerDashboard.tickets";
}

export function PrintTicketButton({
  className,
  variant = "outline",
  size,
  translationNamespace = "ticket",
  ...props
}: PrintTicketButtonProps) {
  const t = useTranslations(translationNamespace);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.print()}
      className={cn("gap-2 print:hidden", className)}
      {...props}
    >
      <Printer className="size-4 shrink-0" />
      {t("printTicket")}
    </Button>
  );
}
