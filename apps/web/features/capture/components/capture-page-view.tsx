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
import { useState } from "react";
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
          <span className="absolute inset-0 rounded-full bg-[#ee237c]/25 motion-reduce:hidden animate-ping" />
          <span className="absolute inset-0 rounded-full bg-[#ee237c]/20 motion-reduce:hidden animate-ping [animation-delay:0.35s]" />
        </>
      ) : null}
      <div className="relative flex size-36 items-center justify-center rounded-full bg-[#07131f] ring-8 ring-[#ee237c]/10">
        <Crosshair className="size-12 text-[#ee237c]" strokeWidth={1.5} />
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
      className="text-sm font-semibold text-[#ee237c] hover:underline"
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
            <h1 className="text-2xl font-extrabold text-slate-900 font-[Montserrat]">
              {t("introTitle")}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("introDesc", { terminal: initialInfo.location.name })}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t("terminalLabel")}
            </p>
            <p className="font-bold text-slate-900">
              {initialInfo.location.name}
            </p>
            <p className="text-xs text-slate-500">
              {t("operatorLabel")}: {initialInfo.companyName ?? "Moja Ride"}
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleShareLocation();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="capture-name" className="text-xs text-slate-600">
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
              <Label htmlFor="capture-phone" className="text-xs text-slate-600">
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
              <Label htmlFor="capture-notes" className="text-xs text-slate-600">
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
              className="w-full h-12 gap-2 rounded-xl bg-[#ee237c] font-bold text-white shadow-sm hover:bg-[#d61d6d]"
            >
              <MapPin className="size-4" />
              {t("shareLocation")}
            </Button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <Lock className="size-3.5" />
            {t("privacyNote")}
          </p>
        </>
      )}

      {(phase === "locating" || phase === "submitting") && (
        <div className="text-center space-y-5 py-6">
          <Radar active />
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <Spinner className="size-4 text-[#ee237c]" />
            {phase === "locating" ? t("locating") : t("submitting")}
          </p>
        </div>
      )}

      {phase === "preview" && preview && (
        <>
          <div className="text-center space-y-2">
            <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100">
              <MapPin className="size-9 text-emerald-600" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-[Montserrat]">
              {t("previewTitle")}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("previewDesc")}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t("terminalLabel")}
            </p>
            {preview.resolvedAddress ? (
              <>
                <p className="font-bold text-slate-900">
                  {preview.resolvedAddress}
                </p>
                <p className="text-xs text-slate-500">
                  {t("resolvedAddress")} · {resolvedLabel}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-slate-900">{resolvedLabel}</p>
                {preview.resolved.quarterName ? (
                  <p className="text-xs text-slate-500">
                    {preview.resolved.cityName} ·{" "}
                    {preview.resolved.municipalityName}
                  </p>
                ) : null}
              </>
            )}
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
              <Crosshair className="size-3.5" />
              {preview.latitude.toFixed(5)}, {preview.longitude.toFixed(5)} · ±
              {preview.accuracyMeters}m
            </p>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
            className="w-full h-12 gap-2 rounded-xl bg-[#ee237c] font-bold text-white shadow-sm hover:bg-[#d61d6d]"
          >
            {confirmMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {confirmMutation.isPending ? t("confirming") : t("confirm")}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={handleShareLocation}
              disabled={submitMutation.isPending}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              <RefreshCw className="size-3.5" />
              {t("retry")}
            </button>
          </div>
        </>
      )}

      {phase === "confirmPrompt" && (
        <div className="text-center space-y-5 py-6">
          <Radar active />
          <p className="text-sm text-slate-600 leading-relaxed">
            {t("continueConfirm")}
          </p>
          <Button
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
            className="w-full h-12 gap-2 rounded-xl bg-[#ee237c] font-bold text-white shadow-sm hover:bg-[#d61d6d]"
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
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <Spinner className="size-4 text-[#ee237c]" />
            {t("confirming")}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4 py-6">
          <div className="relative mx-auto flex size-24 items-center justify-center rounded-full bg-emerald-100">
            <span className="absolute inset-0 rounded-full bg-emerald-200/70 motion-reduce:hidden animate-ping" />
            <CheckCircle2 className="relative size-12 text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-900 font-[Montserrat]">
              {t("doneTitle")}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("doneDesc")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            <Loader2 className="size-3.5 animate-spin" />
            {t("waitingNote")}
          </span>
          {goHome}
        </div>
      )}

      {phase === "error" && error && (
        <div className="text-center space-y-5 py-6">
          <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-slate-100">
            <MapPin className="size-9 text-slate-400" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-slate-900 font-[Montserrat]">
              {error.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {error.message}
            </p>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setPhase("idle");
            }}
            className="w-full h-12 gap-2 rounded-xl bg-[#ee237c] font-bold text-white shadow-sm hover:bg-[#d61d6d]"
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
