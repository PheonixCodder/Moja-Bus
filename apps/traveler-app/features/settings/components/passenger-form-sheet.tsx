import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PhoneInput, { type ICountry } from "rn-international-phone-number";
import { Text } from "@/components/ui/text";
import { Palette, Colors } from "@/constants/theme";
import { PlaceholderColor } from "@/constants/ui-colors";

export type PassengerFormData = {
	fullName: string;
	phone: string;
	email: string;
	label: string;
	idType?: "national_id" | "passport" | "driver_license";
	idNumber?: string;
	dateOfBirth?: string;
};

type PassengerFormSheetProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: PassengerFormData) => void;
	isPending: boolean;
	initialData?: PassengerFormData | null;
};

const emptyForm: PassengerFormData = {
	fullName: "",
	phone: "",
	email: "",
	label: "",
	idType: "national_id",
	idNumber: "",
	dateOfBirth: "",
};

export function PassengerFormSheet({
	isOpen,
	onClose,
	onSubmit,
	isPending,
	initialData,
}: PassengerFormSheetProps) {
	const insets = useSafeAreaInsets();
	const [form, setForm] = useState<PassengerFormData>(initialData ?? emptyForm);
	const [country, setCountry] = useState<ICountry | null>(null);

	useEffect(() => {
		if (isOpen) {
			setForm(initialData ?? emptyForm);
		}
	}, [isOpen, initialData]);

	const isEditing = !!initialData;

	const handleSubmit = () => {
		if (!form.fullName.trim()) return;

		// Format phone to E.164
		let formattedPhone = form.phone.trim();
		if (formattedPhone && !formattedPhone.startsWith("+")) {
			const dialing = (country as any)?.callingCode || (country as any)?.dialCode
				? `+${(country as any)?.callingCode || (country as any)?.dialCode}`
				: "+225";
			formattedPhone = `${dialing}${formattedPhone.replace(/\D/g, "")}`;
		}

		onSubmit({
			fullName: form.fullName.trim(),
			phone: formattedPhone,
			email: form.email.trim(),
			label: form.label.trim(),
			idType: form.idType,
			idNumber: form.idNumber?.trim() || undefined,
			dateOfBirth: form.dateOfBirth || undefined,
		});
	};

	const isValid = form.fullName.trim().length > 0 && form.phone.trim().length > 0;

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<Pressable
				className="flex-1 bg-black/40"
				onPress={onClose}
			>
				<Pressable
					className="flex-1 justify-end"
					onPress={() => {}}
				>
					<KeyboardAvoidingView
						behavior={Platform.OS === "ios" ? "padding" : undefined}
					>
						<View
							className="bg-card rounded-t-[28px] pt-5 px-4 max-h-[90%]"
							style={{ paddingBottom: insets.bottom + 24 }}
						>
							{/* Drag handle */}
							<View className="w-10 h-1 rounded-full bg-muted self-center mb-4" />

							{/* Header */}
							<View className="flex-row items-center justify-between mb-4">
								<Text className="text-lg font-extrabold text-foreground">
									{isEditing ? "Edit Passenger Profile" : "Add Travel Companion"}
								</Text>
								<Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" className="min-h-9 justify-center items-center">
									<HugeiconsIcon icon={Cancel01Icon} size={22} color={Palette.zinc[400]} />
								</Pressable>
							</View>

							<ScrollView
								style={{ flexGrow: 0 }}
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{ gap: 12 }}
							>
								{/* Full Name */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Full Name *</Text>
									<TextInput
										value={form.fullName}
										onChangeText={(val) => setForm((f) => ({ ...f, fullName: val }))}
										placeholder="Enter full name"
										placeholderTextColor={PlaceholderColor}
										className="bg-background rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
									/>
								</View>

								{/* Phone */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Phone Number *</Text>
									<PhoneInput
										value={form.phone}
										onChangePhoneNumber={(val: string) => setForm((f) => ({ ...f, phone: val }))}
										country={country}
										onChangeCountry={(c: ICountry | null) => setCountry(c)}
										style={{ borderRadius: 12 }}
									/>
								</View>

								{/* ID Type */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Identity Document Type (Optional)</Text>
									<View className="flex-row gap-2">
										{[
											{ key: "national_id", label: "National ID" },
											{ key: "passport", label: "Passport" },
											{ key: "driver_license", label: "License" },
										].map((item) => {
											const isSelected = form.idType === item.key;
											return (
												<Pressable
													key={item.key}
													onPress={() => setForm((f) => ({ ...f, idType: item.key as any }))}
													accessibilityRole="button"
													className={`will-change-variable will-change-pressable flex-1 py-2 items-center rounded-xl border min-h-10 justify-center ${
														isSelected ? "border-primary bg-primary/10" : "border-border bg-muted/40"
													}`}
												>
													<Text className={`will-change-variable text-sm ${isSelected ? "font-bold text-primary" : "font-medium text-foreground"}`}>
														{item.label}
													</Text>
												</Pressable>
											);
										})}
									</View>
								</View>

								{/* ID Number */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Document / ID Number (Optional)</Text>
									<TextInput
										value={form.idNumber}
										onChangeText={(val) => setForm((f) => ({ ...f, idNumber: val }))}
										placeholder="e.g. C001293910"
										placeholderTextColor={PlaceholderColor}
										className="bg-background rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
										autoCapitalize="characters"
									/>
								</View>

								{/* Email */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Email (Optional)</Text>
									<TextInput
										value={form.email}
										onChangeText={(val) => setForm((f) => ({ ...f, email: val }))}
										placeholder="Enter email address"
										placeholderTextColor={PlaceholderColor}
										keyboardType="email-address"
										autoCapitalize="none"
										className="bg-background rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
									/>
								</View>

								{/* Label */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Relationship Label (Optional)</Text>
									<TextInput
										value={form.label}
										onChangeText={(val) => setForm((f) => ({ ...f, label: val }))}
										placeholder="e.g. Family, Spouse, Co-worker"
										placeholderTextColor={PlaceholderColor}
										className="bg-background rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
									/>
								</View>
							</ScrollView>

							{/* Action buttons */}
							<View className="flex-row gap-2 pt-4 mt-3 border-t border-border">
								<Pressable
									onPress={onClose}
									accessibilityRole="button"
									className="flex-1 py-2 rounded-xl border border-border items-center min-h-10 justify-center"
								>
									<Text className="text-sm font-semibold text-muted-foreground">Cancel</Text>
								</Pressable>
								<Pressable
									onPress={handleSubmit}
									disabled={isPending || !isValid}
									accessibilityRole="button"
									className={`flex-1 py-2 rounded-xl bg-primary items-center min-h-10 justify-center ${isPending || !isValid ? "opacity-60" : ""}`}
								>
									{isPending ? (
										<ActivityIndicator size="small" color={Palette.zinc[50]} />
									) : (
										<Text className="text-sm font-bold text-primary-foreground">
											{isEditing ? "Update" : "Save Companion"}
										</Text>
									)}
								</Pressable>
							</View>
						</View>
					</KeyboardAvoidingView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
