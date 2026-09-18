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

function mapProfileToPersonalInfo(profile: any): PersonalInfoData {
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
	const trpc = useTRPC();
	const query = useQuery({
		...trpc.passenger.getPreferences.queryOptions(),
		enabled,
		select: mapProfileToPersonalInfo,
	});
	return query;
}

export function useUpdatePersonalInfo() {
	const trpc = useTRPC();
	return useMutation(trpc.passenger.updatePreferences.mutationOptions());
}

export function useUpdateAvatar() {
	const trpc = useTRPC();
	return useMutation(trpc.passenger.updateAvatar.mutationOptions());
}

