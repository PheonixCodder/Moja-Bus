"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { Button } from "@moja/ui/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@moja/ui/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Bus,
  Calendar,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";
import { DriverDocPreview } from "@/features/driver/components/driver-doc-preview";
import { DriverAnalyticsCharts } from "@/features/operator/components/drivers/driver-analytics-charts";
import { DriverCareerStatsCard } from "@/features/operator/components/drivers/driver-career-stats-card";
import { DriverRosterActions } from "@/features/operator/components/drivers/driver-roster-actions";
import { DriverStatusBadge } from "@/features/operator/components/drivers/driver-status-badge";
import { LicenseExpiryBadge } from "@/features/operator/components/drivers/license-expiry-badge";
import { TrustBadges } from "@/features/operator/components/drivers/trust-badges";
import { computeTrustBadges } from "@/lib/driver-scoring";
import { useTRPC } from "@/trpc/client";

interface DriverDetailViewProps {
  driverId: string;
}

export function DriverDetailView({ driverId }: DriverDetailViewProps) {
  const trpc = useTRPC();
  const driverQuery = useQuery(
    trpc.drivers.getDriver.queryOptions({ id: driverId }),
  );
  const tripHistoryQuery = useQuery(
    trpc.trips.list.queryOptions({
      driverProfileId: driverId,
      status: "ARRIVED",
      pageSize: 50,
    }),
  );

  if (driverQuery.isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Loading driver passport...
      </div>
    );
  }

  const driver = driverQuery.data;
  if (!driver) {
    return (
      <div className="p-12 text-center space-y-3">
        <AlertTriangle className="size-10 text-destructive mx-auto" />
        <div className="text-lg font-bold">Driver Not Found</div>
        <p className="text-sm text-muted-foreground">
          The requested driver profile was not found or is no longer affiliated
          with your fleet.
        </p>
        <Link href="/dashboard/operator/drivers">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="size-4" />
            Back to Drivers Directory
          </Button>
        </Link>
      </div>
    );
  }

  const affiliation = driver.companyAffiliations[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Back Link */}
      <div>
        <Link href="/dashboard/operator/drivers">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Drivers Directory
          </Button>
        </Link>
      </div>

      {/* Driver Header Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-20 border-2 border-primary/20 shadow-sm">
            <AvatarImage src={driver.user.image ?? undefined} />
            <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
              {driver.user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {driver.user.fullName}
              </h1>
              <DriverStatusBadge status={driver.status} />
              {/* Phase 14 (F-OP-03) — licence expiry visibility */}
              <LicenseExpiryBadge
                licenseExpiryDate={driver.licenseExpiryDate}
              />
              {driver.verificationStatus === "VERIFIED" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="size-3.5" />
                  Verified License
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldAlert className="size-3.5" />
                  Pending Compliance
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {driver.user.phoneNumber && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {driver.user.phoneNumber}
                </span>
              )}
              {driver.user.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {driver.user.email}
                </span>
              )}
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                Badge: {affiliation?.badgeNumber || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="p-3 rounded-xl bg-muted/60 text-right border border-border">
            <div className="text-xs text-muted-foreground">
              Employment Model
            </div>
            <div className="text-sm font-bold text-foreground">
              {affiliation?.employmentType === "EXCLUSIVE_INTERCITY"
                ? "Intercity Exclusive"
                : affiliation?.employmentType === "HYBRID"
                  ? "Hybrid (Multi-Mode)"
                  : "Urban Contractor"}
            </div>
          </div>

          {/* Phase 13 (F-OP-02) — roster lifecycle actions */}
          <DriverRosterActions
            driverId={driverId}
            driverName={driver.user.fullName}
            isActive={affiliation?.isActive ?? false}
            isMidRun={!!driver.currentTrip}
            defaults={{
              licenseNumber: driver.licenseNumber ?? "",
              licenseCategory: driver.licenseCategory ?? "D",
              licenseExpiryDate: driver.licenseExpiryDate
                ? new Date(driver.licenseExpiryDate).toISOString()
                : "",
              badgeNumber: affiliation?.badgeNumber ?? "",
              notes: affiliation?.notes ?? "",
            }}
          />
        </div>
      </div>

      {/* Phase 13 — Trust badges (computed on read) */}
      {(() => {
        const badges = computeTrustBadges({
          averageRating: driver.averageRating,
          totalReviews: driver.totalReviews,
          safetyScore: driver.safetyScore,
          totalTripsCompleted: driver.totalTripsCompleted,
        });
        return badges.length > 0 ? <TrustBadges badges={badges} /> : null;
      })()}

      {/* Lifetime Career Stats */}
      <DriverCareerStatsCard
        averageRating={driver.averageRating}
        totalReviews={driver.totalReviews}
        totalTripsCompleted={driver.totalTripsCompleted}
        totalDistanceKm={driver.totalDistanceKm}
        safetyScore={driver.safetyScore}
      />

      {/* Detail Tabs */}
      <Tabs defaultValue="credentials" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="credentials">Credentials & License</TabsTrigger>
          <TabsTrigger value="trips">Trip History</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({driver.reviews.length})
          </TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Driving License Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">
                    License Number
                  </div>
                  <div className="font-mono font-bold text-foreground mt-0.5">
                    {driver.licenseNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    License Category
                  </div>
                  <div className="font-bold text-foreground mt-0.5">
                    Class {driver.licenseCategory} (Passenger Bus)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Expiry Date
                  </div>
                  <div className="font-medium text-foreground mt-0.5">
                    {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Driving Experience
                  </div>
                  <div className="font-medium text-foreground mt-0.5">
                    {driver.yearsOfExperience} Years
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Medical & Compliance Records
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Medical Clearance Date
                  </div>
                  <div className="font-medium text-foreground mt-0.5">
                    {driver.medicalClearanceDate
                      ? new Date(
                          driver.medicalClearanceDate,
                        ).toLocaleDateString()
                      : "Pending submission"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Affiliated Since
                  </div>
                  <div className="font-medium text-foreground mt-0.5">
                    {affiliation?.hiredAt
                      ? new Date(affiliation.hiredAt).toLocaleDateString()
                      : "Recent"}
                  </div>
                </div>
              </div>
              {affiliation?.notes && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                  <span className="font-semibold text-foreground">
                    Operational Notes:{" "}
                  </span>
                  {affiliation.notes}
                </div>
              )}
            </div>
          </div>

          {/* Phase-2 audit — compliance document inspector. Raw stored keys
              render through on-demand presigning; operators can finally SEE
              what they are verifying (gap #2). */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Compliance Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DriverDocPreview
                audience="operator"
                driverProfileId={driverId}
                docType="driver-license-front"
                label="Licence (Front)"
                storedValue={driver.licenseFrontUrl ?? null}
              />
              <DriverDocPreview
                audience="operator"
                driverProfileId={driverId}
                docType="driver-license-back"
                label="Licence (Back)"
                storedValue={driver.licenseBackUrl ?? null}
              />
              <DriverDocPreview
                audience="operator"
                driverProfileId={driverId}
                docType="driver-medical-doc"
                label="Medical Certificate"
                storedValue={driver.medicalDocUrl ?? null}
              />
            </div>
          </div>
        </TabsContent>

        {/* Trips Tab */}
        <TabsContent value="trips" className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4">
              Assigned Trips & Completed Runs
            </h3>
            {driver.currentTrip ? (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bus className="size-5 text-indigo-500" />
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      Active Trip In Progress
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Bus Plate: {driver.currentTrip.bus.registrationPlate}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  {driver.currentTrip.status}
                </span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic py-2">
                No active trip currently dispatched.
              </div>
            )}

            {/* Trip History */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Completed Trips
                </h4>
                <span className="text-xs text-muted-foreground">
                  {driver._count.assignedTrips} total
                </span>
              </div>
              {tripHistoryQuery.isLoading ? (
                <div className="text-xs text-muted-foreground py-4 text-center">
                  Loading trip history...
                </div>
              ) : (tripHistoryQuery.data?.items.length ?? 0) === 0 ? (
                <div className="text-xs text-muted-foreground italic py-4 text-center">
                  No completed trips found for this driver.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {tripHistoryQuery.data?.items.map((trip) => {
                    const route = trip.schedule?.route;
                    const origin =
                      route?.originTerminal?.cityRelation?.name ??
                      route?.originTerminal?.name ??
                      "—";
                    const dest =
                      route?.destTerminal?.cityRelation?.name ??
                      route?.destTerminal?.name ??
                      "—";
                    const assignment = trip.driverAssignments?.find(
                      (a) => a.driverProfileId === driverId,
                    );
                    const roleLabel =
                      assignment?.role === "PRIMARY"
                        ? "Primary"
                        : assignment?.role === "RELIEF"
                          ? "Relief"
                          : assignment?.role === "CONDUCTOR"
                            ? "Conductor"
                            : "";
                    return (
                      <div
                        key={trip.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {origin} → {dest}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(trip.departureDate).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                            {trip.bus?.registrationPlate
                              ? ` · ${trip.bus.registrationPlate}`
                              : ""}
                            {roleLabel ? ` · ${roleLabel}` : ""}
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          ARRIVED
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              Passenger Ratings & Verified Feedback
            </h3>
            {driver.reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No reviews logged for this driver yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {driver.reviews.map((rev) => (
                  <div key={rev.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-foreground">
                        {rev.author.fullName}
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star className="size-3.5 fill-amber-500" />
                        {rev.rating}/5
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {rev.driverRating && (
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          Driver Safety:{" "}
                          <strong className="text-foreground">
                            {rev.driverRating}/5
                          </strong>
                        </span>
                      )}
                      {rev.busRating && (
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          Vehicle:{" "}
                          <strong className="text-foreground">
                            {rev.busRating}/5
                          </strong>
                        </span>
                      )}
                      {rev.punctualityRating && (
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          Punctuality:{" "}
                          <strong className="text-foreground">
                            {rev.punctualityRating}/5
                          </strong>
                        </span>
                      )}
                    </div>

                    {rev.content && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        "{rev.content}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <DriverAnalyticsCharts driverProfileId={driverId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
