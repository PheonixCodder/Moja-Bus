"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, MessageCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";

function StarRating({
  rating,
  size = "size-4",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            size,
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200",
          )}
        />
      ))}
    </div>
  );
}

export function OperatorReviewsView() {
  const t = useTranslations("operatorDashboard.reviews");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { can } = useStaffPermissions();

  const { data } = useSuspenseQuery(trpc.operator.listReviews.queryOptions());
  const canRespond = can("reviews:respond");

  const respondMutation = useMutation(
    trpc.operator.respondToReview.mutationOptions({
      onSuccess: () => {
        toast.success(t("responsePublished"));
        void queryClient.invalidateQueries(
          trpc.operator.listReviews.queryFilter(),
        );
      },
      onError: (err) => toast.error(err.message || t("responseFailed")),
    }),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (review: { id: string; response: string | null }) => {
    setEditingId(review.id);
    setDraft(review.response ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const handleRespond = async (reviewId: string) => {
    if (!draft.trim()) {
      toast.error(t("responseEmpty"));
      return;
    }
    try {
      await respondMutation.mutateAsync({ reviewId, response: draft.trim() });
      cancelEdit();
    } catch {
      // error toast handled by onError
    }
  };

  const { reviews, total, averageRating, distribution } = data;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>

      {/* Summary banner */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm flex items-center gap-5">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {averageRating.toFixed(1)}
          </p>
          <StarRating rating={Math.round(averageRating)} />
          <p className="text-xs text-muted-foreground mt-1">
            {t("totalReviews", { total })}
          </p>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="flex flex-col gap-1.5 flex-1">
          {distribution.map(({ star, count }) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-3">{star}</span>
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-4">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-16 text-center shadow-sm">
          <MessageCircle className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("noReviews")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const route =
              review.booking?.trip?.schedule?.route;
            const origin =
              route?.originTerminal?.cityRelation?.name ?? t("origin");
            const dest =
              route?.destTerminal?.cityRelation?.name ?? t("destination");
            const departure = review.booking?.trip?.departureDate
              ? format(new Date(review.booking.trip.departureDate), "MMM d, yyyy")
              : null;
            const isEditing = editingId === review.id;

            return (
              <div
                key={review.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {(review.author?.fullName ?? review.author?.email ?? "P")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {review.author?.fullName ?? review.author?.email ?? t("passenger")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {origin} → {dest}
                        {departure ? ` · ${departure}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StarRating rating={review.rating} />
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(review.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {review.content && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.content}
                  </p>
                )}

                {/* 3-Way Review Breakdown */}
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  {review.driver && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-medium">
                      Driver: {review.driver.user.fullName} {review.driverRating ? `(${review.driverRating}★)` : ""}
                    </span>
                  )}
                  {review.bus && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium">
                      Bus: {review.bus.registrationPlate} {review.busRating ? `(${review.busRating}★)` : ""}
                    </span>
                  )}
                  {review.punctualityRating && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                      Punctuality: {review.punctualityRating}★
                    </span>
                  )}
                </div>

                {/* Existing operator response */}
                {review.response && !isEditing ? (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                      {t("response")}
                      {review.respondedAt
                        ? ` · ${format(new Date(review.respondedAt), "MMM d, yyyy")}`
                        : ""}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {review.response}
                    </p>
                    {canRespond ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px] px-2 mt-1"
                        onClick={() => startEdit(review)}
                      >
                        {t("editResponse")}
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {/* Response editor or CTA */}
                {canRespond ? (
                  isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={t("responsePlaceholder")}
                        className="text-sm min-h-20"
                        aria-label={t("responseLabel")}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRespond(review.id)}
                          disabled={respondMutation.isPending || !draft.trim()}
                          className="flex-1"
                        >
                          {respondMutation.isPending ? (
                            t("publishing")
                          ) : review.response ? (
                            t("updateResponse")
                          ) : (
                            t("submitResponse")
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={respondMutation.isPending}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : review.response ? null : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] px-2"
                      onClick={() => startEdit(review)}
                    >
                      <MessageSquare className="size-3.5 mr-1.5" />
                      {t("respond")}
                    </Button>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
