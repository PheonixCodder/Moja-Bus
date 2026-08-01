import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { SubpageHeader } from "@/components/subpage-header";
import { CustomAlert } from "@/components/custom-alert";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { Colors, Spacing } from "@moja/theme/tokens";
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
				title: t("validationError"),
				description: t("fullNameRequired"),
				variant: "destructive",
					confirmLabel: t("ok"),
				onConfirm: () => setAlertState((s) => ({ ...s, visible: false })),
			});
			return;
		}

		updateMutation.mutate(
			{
				fullName: form.fullName.trim(),
				phone: form.phone.trim() || undefined,
				dateOfBirth: form.dateOfBirth || undefined,
			},
			{
				onSuccess: () => {
					setAlertState({
						visible: true,
						title: t("changesSaved"),
						description: t("changesSuccess"),
						confirmLabel: t("done"),
						onConfirm: () => {
							setAlertState((s) => ({ ...s, visible: false }));
							queryClient.invalidateQueries();
						},
					});
				},
				onError: (err: any) => {
					setAlertState({
						visible: true,
						title: t("saveFailed"),
						description: err?.message ?? t("couldNotSave"),
						variant: "destructive",
				confirmLabel: t("ok"),
						onConfirm: () => setAlertState((s) => ({ ...s, visible: false })),
					});
				},
			},
		);
	};

	if (sessionPending || isLoading) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
				<ActivityIndicator size="large" color={Colors.light.primary} />
			</View>
		);
	}

	if (!isAuth) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
					<Text style={{ color: Colors.light.textSecondary, fontSize: 15 }}>
						{t("signInToManage")}
					</Text>
			</View>
		);
	}

	const hasChanges =
		form.fullName !== (info?.fullName ?? "") ||
		form.phone !== (info?.phoneNumber ?? "") ||
		form.dateOfBirth !== (info?.dateOfBirth ?? "");

	return (
		<View style={{ flex: 1, backgroundColor: Colors.light.background }}>
			<SubpageHeader title={t("personalInformation")} />

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingHorizontal: Spacing.four,
					paddingTop: Spacing.two,
					paddingBottom: BottomTabInset + insets.bottom + 24,
					gap: Spacing.three,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<View
					style={{
						backgroundColor: Colors.light.background,
						borderRadius: 20,
						borderWidth: 1,
						borderColor: Colors.light.backgroundSelected,
						padding: Spacing.four,
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.04,
						shadowRadius: 8,
						elevation: 2,
					}}
				>
					<PersonalInfoAvatar
						image={currentAvatar}
						name={info?.fullName ?? "User"}
						onAvatarUpdated={handleAvatarUpdated}
					/>

					<View style={{ height: 1, backgroundColor: Colors.light.backgroundSelected, marginVertical: Spacing.four }} />

					<PersonalInfoForm
						initialData={form}
						email={info?.email ?? ""}
						onChange={handleFormChange}
					/>
				</View>

				<Pressable
					onPress={handleSave}
					disabled={updateMutation.isPending || !hasChanges}
					style={({ pressed }) => ({
						paddingVertical: Spacing.two,
						borderRadius: 14,
						backgroundColor: Colors.light.primary,
						alignItems: "center",
						opacity: updateMutation.isPending || !hasChanges ? 0.6 : pressed ? 0.85 : 1,
						shadowColor: Colors.light.primary,
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.3,
						shadowRadius: 12,
						elevation: 8,
					})}
				>
					{updateMutation.isPending ? (
						<ActivityIndicator size="small" color={Colors.light.primaryForeground} />
					) : (
						<Text style={{ fontSize: 14, fontWeight: "700", color: Colors.light.primaryForeground }}>
							Save Changes
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
