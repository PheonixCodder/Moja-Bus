import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
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

export type PassengerFormData = {
	fullName: string;
	phone: string;
	email: string;
	label: string;
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
		onSubmit({
			fullName: form.fullName.trim(),
			phone: form.phone.trim(),
			email: form.email.trim(),
			label: form.label.trim(),
		});
	};

	const isValid =
		form.fullName.trim().length > 0 && form.phone.trim().length > 0;

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<Pressable
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
				onPress={onClose}
			>
				<Pressable
					style={{ flex: 1, justifyContent: "flex-end" }}
					onPress={() => {}}
				>
					<KeyboardAvoidingView
						behavior={Platform.OS === "ios" ? "padding" : undefined}
					>
						<View
							style={{
								backgroundColor: Colors.light.background,
								borderTopLeftRadius: 28,
								borderTopRightRadius: 28,
								paddingTop: Spacing.five,
								paddingHorizontal: Spacing.four,
								paddingBottom: insets.bottom + 24,
								maxHeight: "90%",
							}}
						>
							<View
								style={{
									width: 40,
									height: 4,
									borderRadius: 2,
									backgroundColor: Colors.light.backgroundSelected,
									alignSelf: "center",
									marginBottom: Spacing.four,
								}}
							/>

							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									marginBottom: Spacing.four,
								}}
							>
								<Text
									style={{
										fontSize: 18,
										fontWeight: "800",
										color: Colors.light.text,
									}}
								>
									{isEditing ? "Edit Passenger" : "Add Passenger"}
								</Text>
								<Pressable onPress={onClose} hitSlop={12}>
									<HugeiconsIcon
										icon={Cancel01Icon}
										size={22}
										color={Colors.light.textSecondary}
									/>
								</Pressable>
							</View>

							<ScrollView
								style={{ flexGrow: 0 }}
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{ gap: Spacing.three }}
							>
								<View style={{ gap: Spacing.one }}>
									<Text
										style={{
											fontSize: 10,
											fontWeight: "700",
											color: Colors.light.textSecondary,
											letterSpacing: 1,
											textTransform: "uppercase",
										}}
									>
										Full Name *
									</Text>
									<TextInput
										value={form.fullName}
										onChangeText={(val) =>
											setForm((f) => ({ ...f, fullName: val }))
										}
										placeholder="Enter full name"
										placeholderTextColor={Colors.light.textSecondary}
										style={{
											backgroundColor: Colors.light.backgroundElement,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: Colors.light.backgroundSelected,
											paddingHorizontal: Spacing.four,
											paddingVertical: Spacing.two,
											fontSize: 14,
											fontWeight: "600",
											color: Colors.light.text,
										}}
									/>
								</View>

								<View style={{ gap: Spacing.one }}>
									<Text
										style={{
											fontSize: 10,
											fontWeight: "700",
											color: Colors.light.textSecondary,
											letterSpacing: 1,
											textTransform: "uppercase",
										}}
									>
										Phone Number *
									</Text>
									<PhoneInput
										value={form.phone}
										onChangePhoneNumber={(val: string) =>
											setForm((f) => ({ ...f, phone: val }))
										}
										country={country}
										onChangeCountry={(c: ICountry | null) => setCountry(c)}
										style={{ borderRadius: 12 }}
									/>
								</View>

								<View style={{ gap: Spacing.one }}>
									<Text
										style={{
											fontSize: 10,
											fontWeight: "700",
											color: Colors.light.textSecondary,
											letterSpacing: 1,
											textTransform: "uppercase",
										}}
									>
										Email (optional)
									</Text>
									<TextInput
										value={form.email}
										onChangeText={(val) =>
											setForm((f) => ({ ...f, email: val }))
										}
										placeholder="Enter email address"
										placeholderTextColor={Colors.light.textSecondary}
										keyboardType="email-address"
										autoCapitalize="none"
										style={{
											backgroundColor: Colors.light.backgroundElement,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: Colors.light.backgroundSelected,
											paddingHorizontal: Spacing.four,
											paddingVertical: Spacing.two,
											fontSize: 14,
											fontWeight: "600",
											color: Colors.light.text,
										}}
									/>
								</View>

								<View style={{ gap: Spacing.one }}>
									<Text
										style={{
											fontSize: 10,
											fontWeight: "700",
											color: Colors.light.textSecondary,
											letterSpacing: 1,
											textTransform: "uppercase",
										}}
									>
										Label (optional)
									</Text>
									<TextInput
										value={form.label}
										onChangeText={(val) =>
											setForm((f) => ({ ...f, label: val }))
										}
										placeholder="e.g. Family, Work, Friend"
										placeholderTextColor={Colors.light.textSecondary}
										style={{
											backgroundColor: Colors.light.backgroundElement,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: Colors.light.backgroundSelected,
											paddingHorizontal: Spacing.four,
											paddingVertical: Spacing.two,
											fontSize: 14,
											fontWeight: "600",
											color: Colors.light.text,
										}}
									/>
								</View>
							</ScrollView>

							<View
								style={{
									flexDirection: "row",
									gap: Spacing.two,
									paddingTop: Spacing.four,
									marginTop: Spacing.three,
									borderTopWidth: 1,
									borderTopColor: Colors.light.backgroundSelected,
								}}
							>
								<Pressable
									onPress={onClose}
									style={{
										flex: 1,
										paddingVertical: Spacing.two,
										borderRadius: 12,
										borderWidth: 1,
										borderColor: Colors.light.backgroundSelected,
										alignItems: "center",
									}}
								>
									<Text
										style={{
											fontSize: 13,
											fontWeight: "600",
											color: Colors.light.textSecondary,
										}}
									>
										Cancel
									</Text>
								</Pressable>
								<Pressable
									onPress={handleSubmit}
									disabled={isPending || !isValid}
									style={{
										flex: 1,
										paddingVertical: Spacing.two,
										borderRadius: 12,
										backgroundColor: Colors.light.primary,
										alignItems: "center",
										opacity: isPending || !isValid ? 0.6 : 1,
									}}
								>
									{isPending ? (
										<ActivityIndicator
											size="small"
											color={Colors.light.primaryForeground}
										/>
									) : (
										<Text
											style={{
												fontSize: 13,
												fontWeight: "700",
												color: Colors.light.primaryForeground,
											}}
										>
											{isEditing ? "Update" : "Save"}
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
