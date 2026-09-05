"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  Crosshair,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { formatLocationLabel } from "@/lib/format-location-label";
import { type RouterOutputs, useTRPC } from "@/trpc/client";

type CaptureInfo = RouterOutputs["captures"]["getInfo"];
type SubmitResult = RouterOutputs["captures"]["submit"];

type Phase =
  | "idle"
  | "locating"
  | "submitting"
  | "preview"
  | "confirmPrompt"
  | "confirming"
  | "done"
  | "error";

interface CapturePageViewProps {
  token: string;
  initialInfo: CaptureInfo;
}

function Radar({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto size-36" aria-hidden="true">
      {active ? (
        <>
          <span className="absolute inset-0 rounded-full bg-primary/25 motion-reduce:hidden animate-ping" />
          <span className="absolute inset-0 rounded-full bg-primary/20 motion-reduce:hidden animate-ping [animation-delay:0.35s]" />
        </>
      ) : null}
      <div className="relative flex size-36 items-center justify-center rounded-full bg-foreground text-background ring-8 ring-primary/10">
        <Crosshair className="size-12 text-primary" strokeWidth={1.5} />
      </div>
    </div>
  );
}

export function CapturePageView({ token, initialInfo }: CapturePageViewProps) {
  const t = useTranslations("capturePage");
  const trpc = useTRPC();

  const [phase, setPhase] = useState<Phase>(
    initialInfo.status === "CONFIRMED"
      ? "done"
      : initialInfo.status === "PENDING_CONFIRMATION"
        ? "confirmPrompt"
        : "idle",
  );
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [preview, setPreview] = useState<SubmitResult | null>(null);
  const [submitterName, setSubmitterName] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [notes, setNotes] = useState("");

  const submitMutation = useMutation(
    trpc.captures.submit.mutationOptions({
      onSuccess: (result) => {
        setPreview(result);
        setPhase("preview");
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : t("locateFailedDesc");
        setError({ title: t("errorTitle"), message });
        setPhase("error");
      },
    }),
  );

  const confirmMutation = useMutation(
    trpc.captures.confirm.mutationOptions({
      onSuccess: () => setPhase("done"),
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : t("invalidLink");
        setError({ title: t("errorTitle"), message });
        setPhase("error");
      },
    }),
  );

  const handleShareLocation = () => {
    setError(null);
    setPhase("locating");

    if (!("geolocation" in navigator)) {
      setError({ title: t("locateFailed"), message: t("locateFailedDesc") });
      setPhase("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const accuracyMeters = Math.round(accuracy);
        if (accuracyMeters > 150) {
          setError({
            title: t("errorTitle"),
            message: t("accuracyBad", { accuracy: accuracyMeters }),
          });
          setPhase("error");
          return;
        }
        setPhase("submitting");
        submitMutation.mutate({
          token,
          latitude,
          longitude,
          accuracyMeters,
          submitterName: submitterName.trim() || undefined,
          submitterPhone: submitterPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError({
            title: t("permissionDenied"),
            message: t("permissionDeniedDesc"),
          });
        } else {
          setError({
            title: t("locateFailed"),
            message: t("locateFailedDesc"),
          });
        }
        setPhase("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleConfirm = () => {
    setPhase("confirming");
    confirmMutation.mutate({ token });
  };

  const resolvedLabel = preview
    ? formatLocationLabel({
        cityName: preview.resolved.cityName,
        municipalityName: preview.resolved.municipalityName,
        quarterName: preview.resolved.quarterName ?? undefined,
        isUrban: false,
      })
    : "";

  const goHome = (
    <Link
      href="/"
      className="text-sm font-semibold text-primary hover:underline"
    >
      {t("goHome")}
    </Link>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      {phase === "idle" && (
        <>
          <div className="text-center space-y-2">
            <Radar active={false} />
            <h1 className="text-2xl font-extrabold text-foreground font-[Montserrat]">
              {t("introTitle")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("introDesc", { terminal: initialInfo.location.name })}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("terminalLabel")}
            </p>
            <p className="font-bold text-foreground">
              {initialInfo.location.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("operatorLabel")}: {initialInfo.companyName ?? "Moja Ride"}
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              handleShareLocation();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="capture-name" className="text-xs text-muted-foreground">
                {t("nameLabel")}
              </Label>
              <Input
                id="capture-name"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder={t("namePlaceholder")}
                autoComplete="name"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capture-phone" className="text-xs text-muted-foreground">
                {t("phoneLabel")}
              </Label>
              <Input
                id="capture-phone"
                value={submitterPhone}
                onChange={(e) => setSubmitterPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                inputMode="tel"
                autoComplete="tel"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capture-notes" className="text-xs text-muted-foreground">
                {t("addressLabel")}
              </Label>
              <Textarea
                id="capture-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("addressPlaceholder")}
                rows={2}
                className="resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <MapPin className="size-4" />
              {t("shareLocation")}
            </Button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground/70">
            <Lock className="size-3.5" />
            {t("privacyNote")}
          </p>
        </>
      )}

      {(phase === "locating" || phase === "submitting") && (
        <div className="text-center space-y-5 py-6">
          <Radar active />
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
            <Spinner className="size-4 text-primary" />
            {phase === "locating" ? t("locating") : t("submitting")}
          </p>
        </div>
      )}

      {phase === "preview" && preview && (
        <>
          <div className="text-center space-y-2">
            <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-success/10">
              <MapPin className="size-9 text-success" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground font-[Montserrat]">
              {t("previewTitle")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("previewDesc")}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("terminalLabel")}
            </p>
            {preview.resolvedAddress ? (
              <>
                <p className="font-bold text-foreground">
                  {preview.resolvedAddress}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("resolvedAddress")} · {resolvedLabel}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-foreground">{resolvedLabel}</p>
                {preview.resolved.quarterName ? (
                  <p className="text-xs text-muted-foreground">
                    {preview.resolved.cityName} ·{" "}
                    {preview.resolved.municipalityName}
                  </p>
                ) : null}
              </>
            )}
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/70">
              <Crosshair className="size-3.5" />
              {preview.latitude.toFixed(5)}, {preview.longitude.toFixed(5)} · ±
              {preview.accuracyMeters}m
            </p>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
            className="w-full h-12 gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {confirmMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {confirmMutation.isPending ? t("confirming") : t("confirm")}
          </Button>
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleShareLocation}
              disabled={submitMutation.isPending}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground h-auto p-1 font-normal"
            >
              <RefreshCw className="size-3.5" />
              {t("retry")}
            </Button>
          </div>
        </>
      )}

      {phase === "confirmPrompt" && (
        <div className="text-center space-y-5 py-6">
          <Radar active />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("continueConfirm")}
          </p>
          <Button
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
            className="w-full h-12 gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {confirmMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {confirmMutation.isPending ? t("confirming") : t("confirm")}
          </Button>
        </div>
      )}

      {phase === "confirming" && (
        <div className="text-center space-y-5 py-6">
          <Radar active />
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
            <Spinner className="size-4 text-primary" />
            {t("confirming")}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4 py-6">
          <div className="relative mx-auto flex size-24 items-center justify-center rounded-full bg-success/10">
            <span className="absolute inset-0 rounded-full bg-success/20 motion-reduce:hidden animate-ping" />
            <CheckCircle2 className="relative size-12 text-success" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-foreground font-[Montserrat]">
              {t("doneTitle")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("doneDesc")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning ring-1 ring-warning/30">
            <Loader2 className="size-3.5 animate-spin" />
            {t("waitingNote")}
          </span>
          {goHome}
        </div>
      )}

      {phase === "error" && error && (
        <div className="text-center space-y-5 py-6">
          <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-muted">
            <MapPin className="size-9 text-muted-foreground/60" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-foreground font-[Montserrat]">
              {error.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error.message}
            </p>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setPhase("idle");
            }}
            className="w-full h-12 gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <RefreshCw className="size-4" />
            {t("retry")}
          </Button>
          {goHome}
        </div>
      )}
    </div>
  );
}
