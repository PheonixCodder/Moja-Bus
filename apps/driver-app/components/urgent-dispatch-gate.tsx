import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import {
	UrgentDispatchModal,
	type UrgentDispatchPayload,
} from "@/features/dispatch/components/urgent-dispatch-modal";

type UrgentResponse = {
	items: Array<{ assignmentRole: string; dispatch: UrgentDispatchPayload }>;
};

/**
 * Phase 12 — Mounts the full-screen UrgentDispatchModal when a driver has an
 * upcoming run departing within the 2-hour window.
 *
 * Phase 31 (F-DV-14) — acknowledgements are PERSISTED SERVER-SIDE on the
 * assignment row (survive reinstalls/re-logins/devices); the feed excludes
 * acked rows. Local state here is only an optimistic cache so the modal
 * dismisses instantly while the mutation is in flight.
 */
export function UrgentDispatchGate() {
	const router = useRouter();
	const trpc = useTRPC();
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
			// Server truth wins on the next poll; a failure re-surfaces the
			// dispatch (loud retry beats silent loss of an urgent run).
			onError: () => {},
		}),
	);

	const pending = useMemo(() => {
		const items = (urgentQuery.data as UrgentResponse | undefined)?.items ?? [];
		return items.filter((i) => !dismissed.includes(i.dispatch.tripId));
	}, [urgentQuery.data, dismissed]);

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
			onAccept={(tripId) => {
				acknowledge(tripId);
				router.push("/(tabs)/trips");
			}}
			onDecline={(tripId) => {
				acknowledge(tripId);
			}}
		/>
	);
}
