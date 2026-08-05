import { getPrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CapturePageView } from "@/features/capture/components/capture-page-view";
import type { CaptureService } from "@/features/capture/services/capture-service";
import { createCaptureService } from "@/features/capture/services/capture-service";

interface CaptureMetaProps {
  params: Promise<{ token: string; locale: string }>;
}

export async function generateMetadata({ params }: CaptureMetaProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "capturePage" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface CapturePageProps {
  params: Promise<{ token: string }>;
}

function CaptureHeader({ label }: { label: string }) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center gap-2">
        <MapPin className="size-5 text-[#ee237c]" />
        <Link href="/" className="text-sm font-bold text-slate-900">
          Moja Ride
        </Link>
        <span className="text-xs text-slate-500 ml-auto">{label}</span>
      </div>
    </header>
  );
}

function CaptureErrorScreen({
  title,
  body,
  homeLabel,
}: {
  title: string;
  body: string;
  homeLabel: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <CaptureHeader label="Moja Ride" />
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100">
          <MapPin className="size-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 font-[Montserrat]">
          {title}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
        <Link
          href="/"
          className="inline-block text-sm font-semibold text-[#ee237c] hover:underline"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}

export default async function CapturePage({ params }: CapturePageProps) {
  const { token } = await params;
  const t = await getTranslations("capturePage");

  let info: Awaited<ReturnType<CaptureService["getInfo"]>>;
  try {
    info = await createCaptureService(getPrismaClient()).getInfo({ token });
  } catch (err) {
    const message =
      err instanceof TRPCError && err.message.includes("expired")
        ? t("expiredLink")
        : err instanceof TRPCError && err.message.includes("rejected")
          ? t("rejectedLink")
          : t("invalidLink");
    return (
      <CaptureErrorScreen
        title={t("errorTitle")}
        body={message}
        homeLabel={t("goHome")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CaptureHeader label={t("header")} />
      <CapturePageView token={token} initialInfo={info} />
    </div>
  );
}
