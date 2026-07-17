"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, CalendarDays, Ticket, Wallet, Users, Settings, LayoutDashboard } from "lucide-react";

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

const passengerSearchItems: SearchItem[] = [
  { id: "dashboard", title: "Dashboard Overview", url: "/dashboard", icon: LayoutDashboard },
  { id: "bookings", title: "My Bookings", url: "/dashboard/bookings", icon: CalendarDays },
  { id: "tickets", title: "Active QR Tickets", url: "/dashboard/tickets", icon: Ticket },
  { id: "wallet", title: "Wallet & Ledger Statement", url: "/dashboard/wallet", icon: Wallet },
  { id: "passengers", title: "Saved Passenger Contacts", url: "/dashboard/passengers", icon: Users },
  { id: "settings", title: "Account Settings & Profile", url: "/dashboard/settings", icon: Settings },
];

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

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
        Search...
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search pages..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Dashboard Navigation">
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
