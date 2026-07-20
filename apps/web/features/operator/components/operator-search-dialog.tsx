"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CalendarDays,
  Bus,
  Map,
  Clock,
  Banknote,
  Settings,
  Users,
  Building,
  Route,
  Wallet,
  Ticket,
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
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

interface SearchItem {
  id: string;
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface EntityResult {
  id: string;
  title: string;
  subtitle?: string | undefined;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const operatorSearchItems: SearchItem[] = [
  { id: "dashboard", title: "Dashboard Overview", url: "/dashboard/operator", icon: Building },
  { id: "bookings", title: "Bookings & Passengers", url: "/dashboard/operator/bookings", icon: CalendarDays },
  { id: "fleet", title: "Fleet & Vehicles", url: "/dashboard/operator/fleet", icon: Bus },
  { id: "routes", title: "Routes & Destinations", url: "/dashboard/operator/routes", icon: Map },
  { id: "schedules", title: "Schedules & Automation", url: "/dashboard/operator/schedules", icon: Clock },
  { id: "trips", title: "Active Trips", url: "/dashboard/operator/trips", icon: Route },
  { id: "terminals", title: "Terminals & Locations", url: "/dashboard/operator/terminals", icon: Building },
  { id: "revenue", title: "Revenue & Sales", url: "/dashboard/operator/revenue", icon: Banknote },
  { id: "withdraw", title: "Withdrawals & Payouts", url: "/dashboard/operator/withdraw", icon: Wallet },
  { id: "staff", title: "Staff & Team", url: "/dashboard/operator/staff", icon: Users },
  { id: "settings", title: "Company Settings", url: "/dashboard/operator/settings", icon: Settings },
];

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function OperatorSearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  const trpc = useTRPC();

  const debounced = useDebounced(query, 250);

  const { data: results } = useQuery({
    ...trpc.operator.globalSearch.queryOptions({ q: debounced }),
    enabled: debounced.trim().length >= 1,
  });

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

  // Clear the query when the dialog closes so stale results don't linger.
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const bookingResults: EntityResult[] = (results?.bookings ?? []).map((b) => ({
    id: b.id,
    title: `${b.bookingReference} · ${b.passengerName}`,
    subtitle: `${b.trip?.schedule?.route?.originTerminal?.cityRelation?.name ?? ""} → ${b.trip?.schedule?.route?.destTerminal?.cityRelation?.name ?? ""}`,
    url: `/dashboard/operator/trips?manifest=${b.tripId}`,
    icon: Ticket,
  }));

  const tripResults: EntityResult[] = (results?.trips ?? []).map((t) => ({
    id: t.id,
    title: `${t.schedule?.route?.originTerminal?.cityRelation?.name ?? ""} → ${t.schedule?.route?.destTerminal?.cityRelation?.name ?? ""}`,
    subtitle: t.departureDate ? new Date(t.departureDate).toLocaleDateString() : undefined,
    url: `/dashboard/operator/trips?manifest=${t.id}`,
    icon: Route,
  }));

  const staffResults: EntityResult[] = (results?.staff ?? []).map((s) => ({
    id: s.id,
    title: s.user?.fullName ?? s.user?.email ?? "Staff",
    subtitle: [s.jobTitle, s.user?.email].filter(Boolean).join(" · ") || undefined,
    url: "/dashboard/operator/staff",
    icon: Users,
  }));

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
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search bookings, trips, staff..."
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {bookingResults.length > 0 ? (
              <CommandGroup heading="Bookings">
                {bookingResults.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={`booking-${r.id}`}
                    onSelect={() => handleSelect(r.url)}
                  >
                    <r.icon className="size-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{r.title}</span>
                    {r.subtitle ? (
                      <span className="text-xs text-muted-foreground ml-1">
                        {r.subtitle}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {tripResults.length > 0 ? (
              <CommandGroup heading="Trips">
                {tripResults.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={`trip-${r.id}`}
                    onSelect={() => handleSelect(r.url)}
                  >
                    <r.icon className="size-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{r.title}</span>
                    {r.subtitle ? (
                      <span className="text-xs text-muted-foreground ml-1">
                        {r.subtitle}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {staffResults.length > 0 ? (
              <CommandGroup heading="Staff">
                {staffResults.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={`staff-${r.id}`}
                    onSelect={() => handleSelect(r.url)}
                  >
                    <r.icon className="size-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{r.title}</span>
                    {r.subtitle ? (
                      <span className="text-xs text-muted-foreground ml-1">
                        {r.subtitle}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            <CommandGroup heading="Quick Navigation">
              {operatorSearchItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`nav-${item.id}`}
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
