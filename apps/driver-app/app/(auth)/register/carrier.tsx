import { useEffect, useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Building01Icon,
	CheckmarkCircle02Icon,
	SentIcon,
} from "@hugeicons/core-free-icons";
import {
	useDriverRegistrationStore,
	type EmploymentType,
} from "@/stores/driver-registration";
import { useWizardGuard } from "@/hooks/use-wizard-guard";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { colors } from "@/constants/theme";

const EMPLOYMENT_TYPE_KEYS: Array<{
	type: EmploymentType;
	titleKey: string;
	descKey: string;
	badgeKey: string;
}> = [
	{
		type: "EXCLUSIVE_INTERCITY",
		titleKey: "employmentExclusiveTitle",
		descKey: "employmentExclusiveDesc",
		badgeKey: "employmentExclusiveBadge",
	},
	{
		type: "CONTRACTOR_URBAN",
		titleKey: "employmentUrbanTitle",
		descKey: "employmentUrbanDesc",
		badgeKey: "employmentUrbanBadge",
	},
	{
		type: "HYBRID",
		titleKey: "employmentHybridTitle",
		descKey: "employmentHybridDesc",
		badgeKey: "employmentHybridBadge",
	},
];

export default function RegisterStep4CarrierScreen() {
	const { t } = useTranslation("auth");
	const router = useRouter();
	useWizardGuard(4);

	const trpc = useTRPC();
	const store = useDriverRegistrationStore();

	useEffect(() => {
		store.updateData({ currentStep: 4 });
	}, []);

	const [code, setCode] = useState(store.carrierCode);
	const [employmentType, setEmploymentType] = useState<EmploymentType>(
		store.employmentType || "EXCLUSIVE_INTERCITY"
	);

	const registerMutation = useMutation(
		trpc.drivers.registerDriver.mutationOptions()
	);

	const handleSubmitRegistration = async () => {
		DriverFeedback.tap();

		try {
			const result = await registerMutation.mutateAsync({
				fullName: store.fullName,
				phone: store.phone,
				licenseNumber: store.licenseNumber,
				licenseCategory: store.licenseCategory,
				licenseExpiryDate: new Date(store.licenseExpiryDate),
				licenseFrontUrl: store.licenseFrontUri || undefined,
				licenseBackUrl: store.licenseBackUri || undefined,
				yearsOfExperience: store.yearsOfExperience,
				selfieUrl: store.profileSelfieUri || undefined,
				medicalDocUrl: store.medicalDocUri || undefined,
				nationalIdNumber: store.nationalIdNumber || undefined,
				employmentType,
				carrierInviteCode: code.trim() || undefined,
			});

			DriverFeedback.successScan();
			// Signal submission so the wizard guard doesn't redirect after we
			// navigate away. Do NOT call store.reset() here — status.tsx already
			// resets the store in its own useEffect once it mounts safely.
			store.updateData({ submitted: true });

			if (!result.affiliated) {
				Alert.alert(
					t("noCarrierTitle"),
					code.trim()
						? t("noCarrierMsgWithCode")
						: t("noCarrierMsgNoCode"),
				);
			}
			router.replace("/(auth)/register/status");
		} catch (err: any) {
			DriverFeedback.invalidScan();
			if (err?.message?.startsWith("PHONE_REVERIFICATION_REQUIRED")) {
				const parts = err.message.split("::");
				Alert.alert(
					t("phoneMismatchTitle"),
					t("phoneMismatchMsg", {
						accountPhone: parts[1] ?? t("otherNumber"),
						inputPhone: parts[2] ?? t("differentNumber"),
					}),
				);
			} else {
				Alert.alert(
					t("submitFailed"),
					err.message || t("submitFailed"),
				);
			}
		}
	};

	return (
		<ScreenShell
			header={
				<View>
					<PageHeader
						title={t("step4Title")}
						subtitle={t("step4Subtitle")}
						showBack
						onBack={() => router.replace("/(auth)/register/documents")}
					/>
					<View className="h-1 bg-card w-full">
						<View className="h-full bg-primary w-full" />
					</View>
				</View>
			}
			footer={
				<Button
					title={t("submitDossier")}
					variant="primary"
					size="lg"
					loading={registerMutation.isPending}
					onPress={handleSubmitRegistration}
					icon={<HugeiconsIcon icon={SentIcon} size={18} color={colors.neutral.textPrimary} />}
					iconPosition="right"
				/>
			}
		>
			<View className="gap-4">
				<Card className="p-5 gap-3">
					<Text className="text-base font-extrabold text-foreground tracking-tight">{t("employmentModeTitle")}</Text>
					<Text className="text-xs text-muted-foreground leading-5">
						{t("employmentModeSubtitle")}
					</Text>

					<View className="gap-2.5 pt-1">
						{EMPLOYMENT_TYPE_KEYS.map((item) => {
							const isSelected = employmentType === item.type;
							return (
								<Button
									key={item.type}
									onPress={() => {
										DriverFeedback.tap();
										setEmploymentType(item.type);
									}}
									variant={isSelected ? "primary" : "outline"}
									className={`p-3.5 h-auto rounded-2xl border-1.5 items-start justify-start gap-1.5 ${
										isSelected
											? "border-primary bg-primary/10"
											: "border-border bg-background"
									}`}
								>
									<View className="flex-row items-center justify-between w-full">
										<Text className="text-sm font-bold text-foreground flex-1">{t(item.titleKey)}</Text>
										<View className="flex-row items-center gap-2">
											<View className="bg-border px-2 py-0.5 rounded">
												<Text className="text-[11px] font-bold text-muted-foreground">{t(item.badgeKey)}</Text>
											</View>
											{isSelected ? (
												<HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color={colors.primary.rose} />
											) : null}
										</View>
									</View>
									<Text className="text-xs text-muted-foreground leading-4">{t(item.descKey)}</Text>
								</Button>
							);
						})}
					</View>
				</Card>

				<Card className="p-5 gap-3">
					<View className="flex-row items-center justify-between">
						<Text className="text-base font-extrabold text-foreground tracking-tight">{t("carrierCodeTitle")}</Text>
						<View className="bg-muted-foreground/20 px-2.5 py-1 rounded-full">
							<Text className="text-[11px] font-bold text-muted-foreground uppercase">{t("carrierCodeOptional")}</Text>
						</View>
					</View>
					<Text className="text-xs text-muted-foreground leading-5">
						{t("carrierCodeSubtitle")}
					</Text>

					<View className="pt-1">
						<Input
							label={t("carrierCodeLabel")}
							placeholder={t("carrierCodePlaceholder")}
							value={code}
							onChangeText={setCode}
							autoCapitalize="characters"
							leftIcon={<HugeiconsIcon icon={Building01Icon} size={18} color={colors.neutral.textMuted} />}
						/>
					</View>
				</Card>
			</View>
		</ScreenShell>
	);
}
