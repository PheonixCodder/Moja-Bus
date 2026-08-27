"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  CalendarDays,
  Ticket,
  Wallet,
  Users,
  Settings,
  LayoutDashboard,
} from "lucide-react";

import { Button } from "@moja/ui/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@moja/ui/components/ui/command";

interface SearchItem {
  id: string;
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function SearchDialog() {
  const t = useTranslations("passengerDashboard.search");
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const passengerSearchItems: SearchItem[] = [
    {
      id: "dashboard",
      title: t("dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "bookings",
      title: t("bookings"),
      url: "/dashboard/bookings",
      icon: CalendarDays,
    },
    {
      id: "tickets",
      title: t("tickets"),
      url: "/dashboard/tickets",
      icon: Ticket,
    },
    {
      id: "wallet",
      title: t("wallet"),
      url: "/dashboard/wallet",
      icon: Wallet,
    },
    {
      id: "passengers",
      title: t("passengers"),
      url: "/dashboard/passengers",
      icon: Users,
    },
    {
      id: "settings",
      title: t("settings"),
      url: "/dashboard/settings",
      icon: Settings,
    },
  ];

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "j") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="link"
        className="px-0! font-normal text-muted-foreground hover:no-underline flex items-center gap-2 text-xs"
      >
        <Search className="size-4" />
        {t("search")}
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder={t("placeholder")} />
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            <CommandGroup heading={t("navHeading")}>
              {passengerSearchItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item.url)}
                >
                  <item.icon className="size-4 mr-2 text-muted-foreground" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
