import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { SubpageHeader } from "@/components/subpage-header";
import { CustomAlert } from "@/components/custom-alert";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";
import {
	usePersonalInfo,
	useUpdatePersonalInfo,
} from "@/hooks/use-personal-info";
import type { PersonalInfoData } from "@/hooks/use-personal-info";
import { PersonalInfoAvatar } from "../components/personal-info-avatar";
import { PersonalInfoForm } from "../components/personal-info-form";
import type { PersonalInfoFormData } from "../components/personal-info-form";

export function PersonalInfoView() {
	const insets = useSafeAreaInsets();
	const queryClient = useQueryClient();
	const { t } = useTranslation("settings");

	const { data: session, isPending: sessionPending } = authClient.useSession();
	const isAuth = !!session?.user;

	const { data: personalInfo, isLoading } = usePersonalInfo(isAuth);
	const updateMutation = useUpdatePersonalInfo();

	const [formData, setFormData] = useState<PersonalInfoFormData | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [alertState, setAlertState] = useState<{
		visible: boolean;
		title: string;
		description: string;
		variant?: "default" | "destructive";
		onConfirm?: () => void;
		confirmLabel?: string;
	}>({ visible: false, title: "", description: "" });

	const info = personalInfo as PersonalInfoData | undefined;

	const form: PersonalInfoFormData = formData ?? {
		fullName: info?.fullName ?? "",
		phone: info?.phoneNumber ?? "",
		dateOfBirth: info?.dateOfBirth ?? "",
		preferredSeat: info?.preferredSeat ?? "NONE",
		preferredClass: info?.preferredClass ?? "STANDARD",
		marketingOptIn: info?.marketingOptIn ?? false,
	};

	const currentAvatar = avatarUrl ?? info?.image ?? null;

	const handleFormChange = useCallback((data: PersonalInfoFormData) => {
		setFormData(data);
	}, []);

	const handleAvatarUpdated = useCallback((imageUrl: string) => {
		setAvatarUrl(imageUrl);
	}, []);

	const handleSave = () => {
		if (!form.fullName.trim()) {
			setAlertState({
				visible: true,
				title: t("validationError") ?? "Validation Error",
				description: t("fullNameRequired") ?? "Full name is required",
				variant: "destructive",
				confirmLabel: "OK",
				onConfirm: () => setAlertState((s) => ({ ...s, visible: false })),
			});
			return;
		}

		// Ensure international E.164 phone formatting if phone is entered
		let normalizedPhone: string | undefined = form.phone.trim() || undefined;
		if (normalizedPhone && !normalizedPhone.startsWith("+")) {
			normalizedPhone = `+${normalizedPhone.replace(/\D/g, "")}`;
		}

		updateMutation.mutate(
			{
				fullName: form.fullName.trim(),
				phone: normalizedPhone,
				dateOfBirth: form.dateOfBirth || undefined,
				preferredSeat: form.preferredSeat,
				preferredClass: form.preferredClass,
				marketingOptIn: form.marketingOptIn,
			},
			{
				onSuccess: () => {
					setAlertState({
						visible: true,
						title: t("changesSaved") ?? "Changes Saved",
						description: t("changesSuccess") ?? "Your personal preferences have been updated successfully.",
						confirmLabel: "Done",
						onConfirm: () => {
							setAlertState((s) => ({ ...s, visible: false }));
							queryClient.invalidateQueries();
						},
					});
				},
				onError: (err: any) => {
					setAlertState({
						visible: true,
						title: t("saveFailed") ?? "Save Failed",
						description: err?.message ?? "Could not save your preferences. Please try again.",
						variant: "destructive",
						confirmLabel: "OK",
						onConfirm: () => setAlertState((s) => ({ ...s, visible: false })),
					});
				},
			},
		);
	};

	if (sessionPending || isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<ActivityIndicator size="large" color="#ee237c" />
			</View>
		);
	}

	if (!isAuth) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<Text className="text-slate-500 text-base">
					{t("signInToManage") ?? "Please sign in to manage your account."}
				</Text>
			</View>
		);
	}

	const hasChanges =
		form.fullName !== (info?.fullName ?? "") ||
		form.phone !== (info?.phoneNumber ?? "") ||
		form.dateOfBirth !== (info?.dateOfBirth ?? "") ||
		form.preferredSeat !== (info?.preferredSeat ?? "NONE") ||
		form.preferredClass !== (info?.preferredClass ?? "STANDARD") ||
		form.marketingOptIn !== (info?.marketingOptIn ?? false);

	return (
		<View className="flex-1 bg-white">
			<SubpageHeader title={t("personalInformation") ?? "Personal Information"} />

			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: 8,
					paddingBottom: BottomTabInset + insets.bottom + 24,
					gap: 12,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<View className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
					<PersonalInfoAvatar
						image={currentAvatar}
						name={info?.fullName ?? "User"}
						onAvatarUpdated={handleAvatarUpdated}
					/>

					<View className="h-[1px] bg-slate-100 my-4" />

					<PersonalInfoForm
						initialData={form}
						email={info?.email ?? ""}
						onChange={handleFormChange}
					/>
				</View>

				<Pressable
					onPress={handleSave}
					disabled={updateMutation.isPending || !hasChanges}
					className="py-3.5 rounded-2xl bg-pink-600 items-center shadow-lg shadow-pink-500/30 active:opacity-85 disabled:opacity-50"
				>
					{updateMutation.isPending ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<Text className="text-sm font-bold text-white">
							{t("saveProfilePreferences")}
						</Text>
					)}
				</Pressable>
			</ScrollView>

			<CustomAlert
				visible={alertState.visible}
				title={alertState.title}
				description={alertState.description}
				confirmLabel={alertState.confirmLabel ?? "OK"}
				cancelLabel=""
				onConfirm={alertState.onConfirm}
				onCancel={() => setAlertState((s) => ({ ...s, visible: false }))}
				variant={alertState.variant}
			/>
		</View>
	);
}
