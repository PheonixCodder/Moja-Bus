import {
  BusFront,
  CalendarDays,
  Ticket,
  Users,
  ArrowRight,
  Wallet,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Search,
} from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/auth-server";
import { getPrismaClient } from "@moja/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { SessionsPanel } from "@/features/dashboard/components/sessions-panel";

export async function DashboardView() {
  const user = await getUser();
  if (!user) {
    return null;
  }
  const prisma = getPrismaClient();
  const userId = user.id;
  const now = new Date();

  // Fetch stats, recent bookings, and passenger profile details in parallel
  const [
    upcomingTripsResult,
    pendingPaymentsResult,
    digitalTicketsResult,
    savedContactsResult,
    recentBookingsResult,
    profileResult,
  ] = await Promise.allSettled([
    prisma.booking.count({
      where: {
        userId,
        status: "CONFIRMED",
        trip: { departureDate: { gt: now } },
      },
    }),
    prisma.booking.count({
      where: {
        userId,
        status: "PENDING_PAYMENT",
        holdExpiresAt: { gt: now },
      },
    }),
    prisma.booking.count({
      where: {
        userId,
        status: "CONFIRMED",
      },
    }),
    prisma.savedPassenger.count({
      where: { profile: { userId } },
    }),
    prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        trip: {
          include: {
            schedule: {
              include: {
                route: {
                  include: {
                    originTerminal: true,
                    destTerminal: true,
                  },
                },
              },
            },
          },
        },
        originTripStop: {
          include: {
            terminal: true,
          },
        },
        destinationTripStop: {
          include: {
            terminal: true,
          },
        },
        company: true,
      },
    }),
    prisma.passengerProfile.findUnique({
      where: { userId },
    }),
  ]);

  const upcomingTripsCount = upcomingTripsResult.status === "fulfilled" ? upcomingTripsResult.value : 0;
  const pendingPaymentsCount = pendingPaymentsResult.status === "fulfilled" ? pendingPaymentsResult.value : 0;
  const digitalTicketsCount = digitalTicketsResult.status === "fulfilled" ? digitalTicketsResult.value : 0;
  const savedContactsCount = savedContactsResult.status === "fulfilled" ? savedContactsResult.value : 0;
  const recentBookings = recentBookingsResult.status === "fulfilled" ? recentBookingsResult.value : [];
  const profile = profileResult.status === "fulfilled" ? profileResult.value : null;

  const preferences = (profile?.preferencesJson as any) || {};
  const walletBalance = preferences.wallet?.balanceXOF ?? 0;

  const stats = [
    {
      title: "Upcoming Trips",
      value: upcomingTripsCount,
      description: "Confirmed upcoming trips",
      icon: BusFront,
      href: "/dashboard/bookings?tab=upcoming",
      colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Pending Payments",
      value: pendingPaymentsCount,
      description: "Awaiting checkout confirmation",
      icon: CalendarDays,
      href: "/dashboard/bookings?tab=pending",
      colorClass: pendingPaymentsCount > 0 
        ? "text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse" 
        : "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Digital Wallet",
      value: `${walletBalance.toLocaleString("fr-FR")} XOF`,
      description: "Pre-funded travel balance",
      icon: Wallet,
      href: "/dashboard/wallet",
      colorClass: "text-neon bg-neon/10 border-neon/20",
    },
    {
      title: "Saved Contacts",
      value: savedContactsCount,
      description: "For rapid booking checkout",
      icon: Users,
      href: "/dashboard/passengers",
      colorClass: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Dashboard" className="lg:hidden" />

      <div className="flex flex-1 flex-col gap-8 p-4 lg:p-8">
        {/* Welcome Section */}
        <div className="bg-bg-surface border border-border/80 rounded-xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 text-text-muted/5 pointer-events-none">
            <BusFront className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Passenger Portal
              </span>
              <h1 className="text-2xl lg:text-3xl font-extrabold font-display tracking-tight text-text-primary">
                Hello, {user.name?.split(" ")[0] ?? "Traveler"}!
              </h1>
              <p className="text-text-secondary text-sm max-w-md leading-relaxed">
                Ready for your next journey? Search for active routes, manage your bookings, and travel securely across Côte d'Ivoire.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "bg-primary text-white hover:bg-primary/95 font-semibold px-4 h-10 rounded-lg shadow-sm gap-2 flex items-center justify-center",
                )}
              >
                <Search className="w-4 h-4" />
                Find a Bus
              </Link>
              <Link
                href="/dashboard/passengers"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-border text-text-primary hover:bg-bg-elevated font-semibold px-4 h-10 rounded-lg gap-2 flex items-center justify-center",
                )}
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link 
                key={stat.title} 
                href={stat.href}
                className="group block transition-all duration-300 hover:-translate-y-0.5"
              >
                <Card className="border-border bg-bg-surface hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-1.5 rounded-md border shrink-0 ${stat.colorClass}`}>
                      <Icon className="size-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-2xl font-extrabold tracking-tight text-text-primary">
                      {stat.value}
                    </div>
                    <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                      {stat.description}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity & Quick Info */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Bookings Stream */}
          <Card className="border-border bg-bg-surface lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-text-primary">Recent Bookings</CardTitle>
                <CardDescription>Your latest travel bookings and schedules.</CardDescription>
              </div>
              <Link
                href="/dashboard/bookings"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-primary hover:text-primary-hover font-semibold gap-1 flex items-center"
                )}
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {recentBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-text-secondary space-y-4">
                  <div className="w-12 h-12 bg-bg-elevated text-text-muted rounded-full flex items-center justify-center">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="font-bold text-text-primary">No Travel Bookings Yet</p>
                    <p className="text-xs">Book tickets to popular destinations like Bouaké, Yamoussoukro, or San Pédro.</p>
                  </div>
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "bg-primary text-white hover:bg-primary/95 mt-2 font-semibold px-4 py-2 rounded-lg"
                    )}
                  >
                    Book a Ticket
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => {
                    const departureDate = booking.trip.departureDate;
                    const routeName = booking.trip.schedule?.route?.name || "Intercity Route";
                    const isConfirmed = booking.status === "CONFIRMED";
                    const isPending = booking.status === "PENDING_PAYMENT";
                    
                    return (
                      <div 
                        key={booking.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/60 rounded-lg hover:bg-bg-elevated/40 transition-colors gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider shrink-0",
                                isConfirmed && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                                isPending && "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              )}
                            >
                              {booking.status.replace("_", " ")}
                            </Badge>
                            <span className="text-[10px] text-text-muted font-mono tracking-tight uppercase">
                              Ref: {booking.bookingReference}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-text-primary">
                            {routeName}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                            <span>{booking.company.name}</span>
                            <span>•</span>
                            <span>
                              {new Date(departureDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-text-primary">
                              Seat {booking.seatId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center">
                          {isConfirmed ? (
                            <Link
                              href={`/tickets/${booking.ticketToken}`}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "border-border text-text-primary hover:bg-bg-elevated h-8 text-xs font-semibold flex items-center justify-center"
                              )}
                            >
                              Ticket Details
                            </Link>
                          ) : isPending ? (
                            <Link
                              href={`/book/${booking.id}`}
                              className={cn(
                                buttonVariants({ variant: "default", size: "sm" }),
                                "bg-primary text-white hover:bg-primary/95 h-8 text-xs font-semibold flex items-center justify-center"
                              )}
                            >
                              Complete Checkout
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/bookings`}
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "sm" }),
                                "h-8 text-xs font-semibold flex items-center justify-center"
                              )}
                            >
                              Details
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Security & Travel Info */}
          <Card className="border-border bg-bg-surface">
            <CardHeader>
              <CardTitle className="text-base font-bold text-text-primary">Travel Guidelines</CardTitle>
              <CardDescription>Essential safety information for Moja travelers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-text-secondary leading-relaxed">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-text-primary block mb-0.5">Verified Operators</span>
                  Every transport operator on Moja Ride is thoroughly verified for permits and safety compliance.
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon/15 text-neon flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-text-primary block mb-0.5">Secure Payments</span>
                  All card and mobile money transactions are securely processed via standard 256-bit SSL encryption.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <SessionsPanel />
      </div>
    </div>
  );
}
