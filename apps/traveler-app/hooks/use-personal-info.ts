import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export interface PersonalInfoData {
	id: string;
	fullName: string;
	email: string;
	phoneNumber: string | null;
	image: string | null;
	dateOfBirth: string | null;
	preferredSeat: "WINDOW" | "AISLE" | "NONE" | null;
	preferredClass: "ECONOMY" | "STANDARD" | "VIP" | null;
	marketingOptIn: boolean;
}

export interface PreferencesData {
	preferredSeat?: "WINDOW" | "AISLE" | "NONE";
	preferredClass?: "ECONOMY" | "STANDARD" | "VIP";
	dateOfBirth?: string;
}

interface UserInfo {
	fullName: string;
	email: string;
	phoneNumber: string | null;
	image: string | null;
}

interface ProfileResponse {
	id: string;
	marketingOptIn: boolean;
	preferencesJson: PreferencesData | null;
	user: UserInfo;
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
	getPreferences: TrpcQuery<void, ProfileResponse>;
	updatePreferences: TrpcMutation<
		{
			fullName?: string;
			phone?: string;
			dateOfBirth?: string;
			preferredSeat?: "WINDOW" | "AISLE" | "NONE";
			preferredClass?: "ECONOMY" | "STANDARD" | "VIP";
			marketingOptIn?: boolean;
		},
		ProfileResponse
	>;
	updateAvatar: TrpcMutation<{ image: string }, { success: boolean }>;
};

type TypedTRPC = {
	passenger: PassengerRouter;
};

function mapProfileToPersonalInfo(profile: ProfileResponse): PersonalInfoData {
	return {
		id: profile.id,
		fullName: profile.user.fullName,
		email: profile.user.email,
		phoneNumber: profile.user.phoneNumber,
		image: profile.user.image,
		dateOfBirth: profile.preferencesJson?.dateOfBirth ?? null,
		preferredSeat: profile.preferencesJson?.preferredSeat ?? null,
		preferredClass: profile.preferencesJson?.preferredClass ?? null,
		marketingOptIn: profile.marketingOptIn,
	};
}

export function usePersonalInfo(enabled?: boolean) {
	const trpc = useTRPC() as unknown as TypedTRPC;
	const query = useQuery({
		...trpc.passenger.getPreferences.queryOptions(),
		enabled,
		select: mapProfileToPersonalInfo,
	});
	return query;
}

export function useUpdatePersonalInfo() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.passenger.updatePreferences.mutationOptions());
}

export function useUpdateAvatar() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.passenger.updateAvatar.mutationOptions());
}

