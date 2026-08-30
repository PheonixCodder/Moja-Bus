"use client";

import { useQueryState, parseAsStringEnum } from "nuqs";
import { Suspense } from "react";
import type { ComponentType, FunctionComponent, ReactNode } from "react";
import { ErrorBoundary as ErrorBoundaryBase } from "react-error-boundary";

// Cast ErrorBoundary to a properly typed function component for JSX compatibility.
// react-error-boundary v6.1.2 exports a class component extending React.Component,
// but Next.js 16's Turbopack type checker on Vercel doesn't resolve the inherited
// 'props' property on the class, causing TS2786 errors. This cast is safe because
// ErrorBoundary is only used as a JSX element here, not for its class methods.
const ErrorBoundary = ErrorBoundaryBase as unknown as FunctionComponent<{
  FallbackComponent: ComponentType<any>;
  children?: ReactNode;
}>;
import { HealthScore } from "./health-score";
import { ProfileSection } from "./profile-section";
import { BankSection } from "./bank-section";
import { DocumentsSection } from "./documents-section";
import { VerificationPipeline } from "./verification-pipeline";
import { ProfileDrawer } from "./drawers/profile-drawer";
import { BankDrawer } from "./drawers/bank-drawer";
import { DocumentsDrawer } from "./drawers/documents-drawer";
import { VerificationDrawer } from "./drawers/verification-drawer";
import { PersonalProfileSection } from "./personal-profile-section";
import { PersonalProfileDrawer } from "./drawers/personal-profile-drawer";
import { SettingsSectionSkeleton } from "./ui/settings-skeleton";
import { SettingsSectionError } from "./ui/settings-error";
import { NotificationPreferences } from "@/features/notifications/components/notification-preferences";
import { useTranslations } from "next-intl";

const actionEnum = parseAsStringEnum([
  "edit-profile",
  "edit-personal-profile",
  "manage-banks",
  "manage-documents",
  "manage-verification",
]).withDefault(null as any);

export function SettingsHub() {
  const t = useTranslations("operatorDashboard.settings.hub");
  // We use nuqs to track which drawer is currently open
  const [action, setAction] = useQueryState("action", actionEnum);

  const clearAction = () => setAction(null);

  return (
    <div className="container max-w-6xl py-8 px-4 md:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{t("description")}</p>
      </div>

      <Suspense fallback={<SettingsSectionSkeleton />}>
        <ErrorBoundary FallbackComponent={SettingsSectionError}>
          <HealthScore />
        </ErrorBoundary>
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Suspense fallback={<SettingsSectionSkeleton />}>
          <ErrorBoundary FallbackComponent={SettingsSectionError}>
            <ProfileSection onManage={() => setAction("edit-profile")} />
          </ErrorBoundary>
        </Suspense>

        <Suspense fallback={<SettingsSectionSkeleton />}>
          <ErrorBoundary FallbackComponent={SettingsSectionError}>
            <PersonalProfileSection
              onManage={() => setAction("edit-personal-profile")}
            />
          </ErrorBoundary>
        </Suspense>

        <Suspense fallback={<SettingsSectionSkeleton />}>
          <ErrorBoundary FallbackComponent={SettingsSectionError}>
            <BankSection onManage={() => setAction("manage-banks")} />
          </ErrorBoundary>
        </Suspense>

        <Suspense fallback={<SettingsSectionSkeleton />}>
          <ErrorBoundary FallbackComponent={SettingsSectionError}>
            <DocumentsSection onManage={() => setAction("manage-documents")} />
          </ErrorBoundary>
        </Suspense>

        <div className="md:col-span-2 lg:col-span-3">
          <Suspense fallback={<SettingsSectionSkeleton />}>
            <ErrorBoundary FallbackComponent={SettingsSectionError}>
              <VerificationPipeline
                onManage={() => setAction("manage-verification")}
              />
            </ErrorBoundary>
          </Suspense>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <Suspense fallback={<SettingsSectionSkeleton />}>
            <ErrorBoundary FallbackComponent={SettingsSectionError}>
              <NotificationPreferences />
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>

      {/* Drawers: Render conditionally to avoid fetching/mounting heavy hooks prematurely */}
      {action === "edit-profile" && (
        <ProfileDrawer isOpen={true} onClose={clearAction} />
      )}
      {action === "edit-personal-profile" && (
        <PersonalProfileDrawer isOpen={true} onClose={clearAction} />
      )}
      {action === "manage-banks" && (
        <BankDrawer isOpen={true} onClose={clearAction} />
      )}
      {action === "manage-documents" && (
        <DocumentsDrawer isOpen={true} onClose={clearAction} />
      )}
      {action === "manage-verification" && (
        <VerificationDrawer isOpen={true} onClose={clearAction} />
      )}
    </div>
  );
}
