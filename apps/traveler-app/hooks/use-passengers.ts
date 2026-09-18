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

export function useSavedPassengers(enabled?: boolean) {
	const trpc = useTRPC();
	return useQuery({
		...trpc.passenger.listSaved.queryOptions(),
		enabled,
	});
}

export function useCreateSavedPassenger() {
	const trpc = useTRPC();
	return useMutation(trpc.passenger.createSaved.mutationOptions());
}

export function useUpdateSavedPassenger() {
	const trpc = useTRPC();
	return useMutation(trpc.passenger.updateSaved.mutationOptions());
}

export function useDeleteSavedPassenger() {
	const trpc = useTRPC();
	return useMutation(trpc.passenger.deleteSaved.mutationOptions());
}
