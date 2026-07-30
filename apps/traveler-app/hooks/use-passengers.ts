import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export interface SavedPassengerDTO {
	id: string;
	fullName: string;
	phone: string;
	email: string | null;
	label: string | null;
	dateOfBirth: Date | null;
	idType: string | null;
	idNumber: string | null;
	isSelf: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface SavedPassengersListResult {
	items: SavedPassengerDTO[];
	total: number;
}

interface TrpcQuery<TInput, TOutput> {
	queryOptions: (input: TInput) => {
		queryKey: unknown[];
		queryFn: () => Promise<TOutput>;
		meta?: Record<string, unknown>;
	};
}

interface TrpcMutation<TInput, TOutput> {
	mutationOptions: () => {
		mutationFn: (input: TInput) => Promise<TOutput>;
	};
}

type PassengerRouter = {
	listSaved: TrpcQuery<void, SavedPassengersListResult>;
	createSaved: TrpcMutation<
		{ fullName: string; phone: string; email?: string; label?: string },
		SavedPassengerDTO
	>;
	updateSaved: TrpcMutation<
		{
			id: string;
			fullName?: string;
			phone?: string;
			email?: string;
			label?: string;
		},
		SavedPassengerDTO
	>;
	deleteSaved: TrpcMutation<{ id: string }, { success: true }>;
};

type TypedTRPC = {
	passenger: PassengerRouter;
};

export function useSavedPassengers(enabled?: boolean) {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useQuery({
		...trpc.passenger.listSaved.queryOptions(),
		enabled,
	});
}

export function useCreateSavedPassenger() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.passenger.createSaved.mutationOptions());
}

export function useUpdateSavedPassenger() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.passenger.updateSaved.mutationOptions());
}

export function useDeleteSavedPassenger() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.passenger.deleteSaved.mutationOptions());
}
