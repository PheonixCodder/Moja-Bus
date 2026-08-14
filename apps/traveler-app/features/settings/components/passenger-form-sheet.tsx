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
							className="bg-white rounded-t-[28px] pt-5 px-4 max-h-[90%]"
							style={{ paddingBottom: insets.bottom + 24 }}
						>
							{/* Drag handle */}
							<View className="w-10 h-1 rounded-full bg-slate-200 self-center mb-4" />

							{/* Header */}
							<View className="flex-row items-center justify-between mb-4">
								<Text className="text-lg font-extrabold text-slate-900">
									{isEditing ? "Edit Passenger Profile" : "Add Travel Companion"}
								</Text>
								<Pressable onPress={onClose} hitSlop={12}>
									<HugeiconsIcon icon={Cancel01Icon} size={22} color="#94a3b8" />
								</Pressable>
							</View>

							<ScrollView
								style={{ flexGrow: 0 }}
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{ gap: 12 }}
							>
								{/* Full Name */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Full Name *</Text>
									<TextInput
										value={form.fullName}
										onChangeText={(val) => setForm((f) => ({ ...f, fullName: val }))}
										placeholder="Enter full name"
										placeholderTextColor="#94a3b8"
										className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
									/>
								</View>

								{/* Phone */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Phone Number *</Text>
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
									<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Identity Document Type (Optional)</Text>
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
													className={`will-change-variable will-change-pressable flex-1 py-2 items-center rounded-xl border ${
														isSelected ? "border-pink-500 bg-pink-50" : "border-slate-200 bg-slate-50"
													}`}
												>
													<Text className={`will-change-variable text-sm ${isSelected ? "font-bold text-pink-600" : "font-medium text-slate-700"}`}>
														{item.label}
													</Text>
												</Pressable>
											);
										})}
									</View>
								</View>

								{/* ID Number */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Document / ID Number (Optional)</Text>
									<TextInput
										value={form.idNumber}
										onChangeText={(val) => setForm((f) => ({ ...f, idNumber: val }))}
										placeholder="e.g. C001293910"
										placeholderTextColor="#94a3b8"
										className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
										autoCapitalize="characters"
									/>
								</View>

								{/* Email */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Email (Optional)</Text>
									<TextInput
										value={form.email}
										onChangeText={(val) => setForm((f) => ({ ...f, email: val }))}
										placeholder="Enter email address"
										placeholderTextColor="#94a3b8"
										keyboardType="email-address"
										autoCapitalize="none"
										className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
									/>
								</View>

								{/* Label */}
								<View className="gap-1">
									<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Relationship Label (Optional)</Text>
									<TextInput
										value={form.label}
										onChangeText={(val) => setForm((f) => ({ ...f, label: val }))}
										placeholder="e.g. Family, Spouse, Co-worker"
										placeholderTextColor="#94a3b8"
										className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
									/>
								</View>
							</ScrollView>

							{/* Action buttons */}
							<View className="flex-row gap-2 pt-4 mt-3 border-t border-slate-100">
								<Pressable
									onPress={onClose}
									className="flex-1 py-2 rounded-xl border border-slate-200 items-center"
								>
									<Text className="text-sm font-semibold text-slate-500">Cancel</Text>
								</Pressable>
								<Pressable
									onPress={handleSubmit}
									disabled={isPending || !isValid}
									className={`flex-1 py-2 rounded-xl bg-pink-600 items-center ${isPending || !isValid ? "opacity-60" : ""}`}
								>
									{isPending ? (
										<ActivityIndicator size="small" color="#ffffff" />
									) : (
										<Text className="text-sm font-bold text-white">
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
