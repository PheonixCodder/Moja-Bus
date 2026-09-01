import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import {
	UrgentDispatchModal,
	type UrgentDispatchPayload,
} from "@/features/dispatch/components/urgent-dispatch-modal";

type UrgentResponse = {
	items: Array<{ assignmentRole: string; dispatch: UrgentDispatchPayload }>;
	serverTimeIso?: string;
};

/**
 * Phase 12 / Phase 1C remediation — Mounts the full-screen UrgentDispatchModal
 * when a driver has an upcoming run departing within the 2-hour window.
 *
 * Captures serverTimeIso to calculate device clock skew, immunizing departure
 * countdowns against local Android clock drift.
 */
export function UrgentDispatchGate() {
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	// Optimistically dismissed tripIds for the current session.
	const [dismissed, setDismissed] = useState<string[]>([]);

	// Only poll when the driver has a verified profile. Unverified/unregistered
	// drivers get a 403 from this endpoint which floods the logs and wastes requests.
	const trpcVStatus = useTRPC();
	const { data: verificationData } = useQuery(
		trpcVStatus.drivers.getMyVerificationStatus.queryOptions(undefined, {
			enabled: !!session?.user,
			staleTime: 60_000,
		})
	);
	const isVerified = verificationData?.driver?.verificationStatus === "VERIFIED";

	const urgentQuery = useQuery({
		...trpc.drivers.getMyUrgentDispatches.queryOptions(),
		refetchInterval: 60_000,
		enabled: !!session?.user && isVerified,
	});

	const acknowledgeMutation = useMutation(
		trpc.drivers.acknowledgeUrgentDispatch.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.drivers.getMyTrips.queryFilter());
			},
			onError: () => {},
		}),
	);

	const urgentData = urgentQuery.data as UrgentResponse | undefined;

	// Calculate clock skew (positive if phone clock is behind server)
	const clockSkewMs = useMemo(() => {
		if (!urgentData?.serverTimeIso) return 0;
		return new Date(urgentData.serverTimeIso).getTime() - Date.now();
	}, [urgentData?.serverTimeIso]);

	const pending = useMemo(() => {
		const items = urgentData?.items ?? [];
		return items.filter((i) => !dismissed.includes(i.dispatch.tripId));
	}, [urgentData, dismissed]);

	const active = pending[0]?.dispatch ?? null;

	const acknowledge = useCallback(
		(tripId: string) => {
			setDismissed((prev) =>
				prev.includes(tripId) ? prev : [...prev, tripId],
			);
			acknowledgeMutation.mutate({ tripId });
		},
		[acknowledgeMutation],
	);

	if (!active) return null;

	return (
		<UrgentDispatchModal
			visible={!!active}
			dispatch={active}
			clockSkewMs={clockSkewMs}
			onAccept={(tripId) => {
				acknowledge(tripId);
				queryClient.invalidateQueries(trpc.drivers.getMyTrips.queryFilter());
				router.push("/(tabs)/trips");
			}}
			onDecline={(tripId) => {
				acknowledge(tripId);
			}}
		/>
	);
}
