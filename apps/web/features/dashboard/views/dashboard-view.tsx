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
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/lib/auth-server";
import { getPrismaClient, FinancialAccountService } from "@moja/db";
import { toSafeDisplayNumber } from "@/lib/money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { SessionsPanel } from "@/features/dashboard/components/sessions-panel";
import { TravelStatsChart } from "@/features/dashboard/components/travel-stats-chart";
import { WalletQuickDeposit } from "@/features/dashboard/components/wallet-quick-deposit";
import { SavedCompanions } from "@/features/dashboard/components/saved-companions";
import { DashboardQuickSearch } from "@/features/dashboard/components/dashboard-quick-search";
import { LiveBoardingPass } from "@/features/dashboard/components/live-boarding-pass";

export async function DashboardView() {
  const t = await getTranslations("passengerDashboard.overview");
  const locale = await getLocale();
  const user = await getUser();
  if (!user) {
    return null;
  }
  const prisma = getPrismaClient();
  const userId = user.id;
  const now = new Date();

  const startOfRange = new Date();
  startOfRange.setMonth(startOfRange.getMonth() - 5);
  startOfRange.setDate(1);
  startOfRange.setHours(0, 0, 0, 0);

  const [
    upcomingTripsResult,
    pendingPaymentsResult,
    digitalTicketsResult,
    savedContactsResult,
    recentBookingsResult,
    profileResult,
    savedPassengersResult,
    monthlyBookingsResult,
    walletResult,
    nextDepartureResult,
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
    prisma.savedPassenger.findMany({
      where: { profile: { userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.booking.findMany({
      where: {
        userId,
        status: "CONFIRMED",
        createdAt: { gte: startOfRange },
      },
      select: { createdAt: true },
    }),
    new FinancialAccountService(prisma).getUserWallet(userId),
    prisma.booking.findFirst({
      where: {
        userId,
        status: "CONFIRMED",
        trip: { departureDate: { gte: now } },
      },
      orderBy: { trip: { departureDate: "asc" } },
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
        originTripStop: { include: { terminal: true } },
        destinationTripStop: { include: { terminal: true } },
      },
    }),
  ]);

  const upcomingTripsCount = upcomingTripsResult.status === "fulfilled" ? upcomingTripsResult.value : 0;
  const pendingPaymentsCount = pendingPaymentsResult.status === "fulfilled" ? pendingPaymentsResult.value : 0;
  const savedContactsCount = savedContactsResult.status === "fulfilled" ? savedContactsResult.value : 0;
  const recentBookings = recentBookingsResult.status === "fulfilled" ? recentBookingsResult.value : [];
  const savedPassengers = savedPassengersResult.status === "fulfilled" ? savedPassengersResult.value : [];
  const monthlyBookings = monthlyBookingsResult.status === "fulfilled" ? monthlyBookingsResult.value : [];
  const wallet = walletResult.status === "fulfilled" ? walletResult.value : null;
  const nextDeparture = nextDepartureResult.status === "fulfilled" ? nextDepartureResult.value : null;

  const walletBalance = wallet ? toSafeDisplayNumber(wallet.availableBalance) : 0;

  const ledgerEntries = wallet
    ? await prisma.ledgerEntry.findMany({
        where: { accountId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
    : [];

  const showLivePass = nextDeparture
    ? new Date(nextDeparture.trip.departureDate).getTime() - now.getTime() <= 24 * 60 * 60 * 1000
    : false;

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d;
  }).reverse();

  const chartData = last6Months.map((date) => {
    const monthLabel = date.toLocaleDateString(locale, { month: "short" });
    const count = monthlyBookings.filter((b) => {
      const bDate = new Date(b.createdAt);
      return bDate.getMonth() === date.getMonth() && bDate.getFullYear() === date.getFullYear();
    }).length;
    return {
      month: monthLabel,
      trips: count,
      spent: count * 7500,
    };
  });

  const stats = [
    {
      title: t("walletTitle"),
      value: `${walletBalance.toLocaleString(locale)} XOF`,
      description: t("walletDescription"),
      icon: Wallet,
      href: "/dashboard/wallet",
      badge: t("walletBadge"),
      badgeVariant: "default" as const,
    },
    {
      title: t("upcomingTitle"),
      value: upcomingTripsCount,
      description: t("upcomingDescription"),
      icon: BusFront,
      href: "/dashboard/bookings?tab=upcoming",
      badge: t("upcomingBadge"),
      badgeVariant: "secondary" as const,
    },
    {
      title: t("pendingTitle"),
      value: pendingPaymentsCount,
      description: t("pendingDescription"),
      icon: CalendarDays,
      href: "/dashboard/bookings?tab=pending",
      badge: pendingPaymentsCount > 0 ? t("pendingBadgeAction") : t("pendingBadgeClear"),
      badgeVariant: (pendingPaymentsCount > 0 ? "destructive" : "outline") as any,
    },
    {
      title: t("passengersTitle"),
      value: savedContactsCount,
      description: t("passengersDescription"),
      icon: Users,
      href: "/dashboard/passengers",
      badge: t("passengersBadge"),
      badgeVariant: "outline" as const,
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        {showLivePass && nextDeparture && (
          <LiveBoardingPass
            origin={nextDeparture.originTripStop?.terminal?.name || t("originTerminal")}
            destination={nextDeparture.destinationTripStop?.terminal?.name || t("destinationTerminal")}
            departureTime={new Date(nextDeparture.trip.departureDate)}
            seatId={nextDeparture.seatId}
            qrPayload={nextDeparture.ticketToken}
          />
        )}

        <div className="bg-linear-to-r from-primary/10 via-primary/5 to-card border border-border/80 rounded-xl p-6 relative overflow-visible shadow-xs dark:bg-card">
          <div className="relative z-10 space-y-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {t("portal")}
              </span>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
                {t("greeting", { name: user.name?.split(" ")[0] ?? "Traveler" })}
              </h1>
              <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                {t("welcomeDescription")}
              </p>
            </div>

            <DashboardQuickSearch />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.title}
                href={stat.href}
                className="group block transition-all duration-300 hover:-translate-y-0.5"
              >
                <Card className="border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                    <Badge variant={stat.badgeVariant} className="text-[9px] tracking-wider font-semibold">
                      {stat.badge}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <div className="font-bold text-2xl tabular-nums leading-none tracking-tight text-foreground">
                        {stat.value}
                      </div>
                      <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-muted-foreground text-xs">{stat.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-card shadow-xs lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">{t("recentBookings")}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t("recentBookingsDesc")}
                </CardDescription>
              </div>
              <Link
                href="/dashboard/bookings"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-primary hover:text-primary/90 font-semibold gap-1 flex items-center"
                )}
              >
                {t("viewAll")} <ArrowRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {recentBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground space-y-4">
                  <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                    <Ticket className="size-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="font-bold text-foreground">{t("noBookingsTitle")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("noBookingsDesc", { cities: "Bouaké, Yamoussoukro, or San Pédro" })}
                    </p>
                  </div>
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "bg-primary text-white hover:bg-primary/95 mt-2 font-semibold px-4 py-2 rounded-lg"
                    )}
                  >
                    {t("bookTicket")}
                  </Link>
                </div>
              ) : (
                <div className="relative border-l border-muted pl-4 ml-2 space-y-6">
                  {recentBookings.map((booking) => {
                    const departureDate = booking.trip.departureDate;
                    const originName = booking.originTripStop?.terminal?.name || t("originTerminal");
                    const destName = booking.destinationTripStop?.terminal?.name || t("destinationTerminal");
                    const isConfirmed = booking.status === "CONFIRMED";
                    const isPending = booking.status === "PENDING_PAYMENT";

                    return (
                      <div key={booking.id} className="relative group">
                        <div
                          className={cn(
                            "absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 bg-background transition-all group-hover:scale-110",
                            isConfirmed && "border-emerald-500 bg-emerald-500",
                            isPending && "border-amber-500 bg-amber-500"
                          )}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/80 rounded-lg bg-card/40 hover:bg-muted/30 transition-colors gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[9px] font-bold uppercase tracking-wider shrink-0",
                                  isConfirmed && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                                  isPending && "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                )}
                              >
                                {isConfirmed ? t("statusConfirmed") : isPending ? t("statusPendingPayment") : booking.status.replace("_", " ")}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {t("refLabel", { ref: booking.bookingReference })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <span className="truncate">{originName}</span>
                              <ArrowRight className="size-3.5 text-muted-foreground" />
                              <span className="truncate">{destName}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                              <span>{booking.company.name}</span>
                              <span>•</span>
                              <span>
                                {new Date(departureDate).toLocaleDateString(locale, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-foreground">
                                {t("timelineSeat", { id: booking.seatId })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:self-center shrink-0">
                            {isConfirmed ? (
                              <Link
                                href={`/tickets/${booking.ticketToken}`}
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "border-border text-foreground hover:bg-muted h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                                )}
                              >
                                <Ticket className="size-3.5" />
                                {t("qrCode")}
                              </Link>
                            ) : isPending ? (
                              <Link
                                href={`/book/${booking.id}`}
                                className={cn(
                                  buttonVariants({ variant: "default", size: "sm" }),
                                  "bg-primary text-white hover:bg-primary/95 h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                                )}
                              >
                                <CreditCard className="size-3.5" />
                                {t("pay")}
                              </Link>
                            ) : (
                              <Link
                                href={`/dashboard/bookings`}
                                className={cn(
                                  buttonVariants({ variant: "ghost", size: "sm" }),
                                  "h-8 text-xs font-semibold flex items-center justify-center"
                                )}
                              >
                                {t("details")}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <WalletQuickDeposit recentTransactions={ledgerEntries} />
            
            <SavedCompanions companions={savedPassengers} />

            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground">{t("travelGuidelines")}</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">
                  {t("travelGuidelinesDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block mb-0.5">{t("verifiedOperators")}</span>
                    {t("verifiedOperatorsDesc")}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CreditCard className="size-4" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block mb-0.5">{t("securePayments")}</span>
                    {t("securePaymentsDesc")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <TravelStatsChart data={chartData} />

        <SessionsPanel />
      </div>
    </div>
  );
}