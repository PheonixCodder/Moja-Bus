import { useState } from "react";
import { Platform, Pressable, Switch, TextInput, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Text } from "@/components/ui/text";

export interface PersonalInfoFormData {
	fullName: string;
	phone: string;
	dateOfBirth: string;
	preferredSeat: "WINDOW" | "AISLE" | "NONE";
	preferredClass: "ECONOMY" | "STANDARD" | "VIP";
	marketingOptIn: boolean;
}

type PersonalInfoFormProps = {
	initialData: PersonalInfoFormData;
	email: string;
	onChange: (data: PersonalInfoFormData) => void;
};

function formatDate(isoString: string): string {
	if (!isoString) return "";
	try {
		const date = new Date(isoString);
		return date.toLocaleDateString("en-US", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	} catch {
		return isoString;
	}
}

export function PersonalInfoForm({ initialData, email, onChange }: PersonalInfoFormProps) {
	const [showDatePicker, setShowDatePicker] = useState(false);
	const dateObj = initialData.dateOfBirth ? new Date(initialData.dateOfBirth) : new Date("2000-01-01");

	const handleDateChange = (_: any, selectedDate?: Date) => {
		if (Platform.OS === "android") setShowDatePicker(false);
		if (selectedDate) onChange({ ...initialData, dateOfBirth: selectedDate.toISOString() });
	};

	const openDatePicker = () => {
		if (Platform.OS === "android") {
			DateTimePickerAndroid.open({
				value: dateObj,
				onValueChange: handleDateChange,
				mode: "date",
				maximumDate: new Date(),
			});
		} else {
			setShowDatePicker(true);
		}
	};

	return (
		<View className="gap-4">
			{/* Full Name */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Full Name</Text>
				<TextInput
					value={initialData.fullName}
					onChangeText={(val) => onChange({ ...initialData, fullName: val })}
					placeholder="Enter your full name"
					placeholderTextColor="#94a3b8"
					className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
					autoCapitalize="words"
				/>
			</View>

			{/* Email (read-only) */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Email Address</Text>
				<View className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 flex-row items-center opacity-60">
					<TextInput
						value={email}
						editable={false}
						className="flex-1 text-sm font-semibold text-slate-900"
					/>
				</View>
				<Text className="text-xs text-slate-400 mt-0.5">Registered email address cannot be changed.</Text>
			</View>

			{/* Phone */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Phone Number (International Format)</Text>
				<TextInput
					value={initialData.phone}
					onChangeText={(val) => onChange({ ...initialData, phone: val })}
					placeholder="+225 07 00 00 00 00"
					placeholderTextColor="#94a3b8"
					className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900"
					keyboardType="phone-pad"
				/>
			</View>

			{/* Date of Birth */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Date of Birth</Text>
				<Pressable
					onPress={openDatePicker}
					className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5"
				>
					<Text className={`text-sm font-semibold ${initialData.dateOfBirth ? "text-slate-900" : "text-slate-400"}`}>
						{initialData.dateOfBirth ? formatDate(initialData.dateOfBirth) : "Select your date of birth"}
					</Text>
				</Pressable>
			</View>

			{showDatePicker && Platform.OS === "ios" && (
				<View className="bg-slate-50 rounded-xl overflow-hidden">
					<DateTimePicker
						value={dateObj}
						mode="date"
						display="spinner"
						maximumDate={new Date()}
						onChange={handleDateChange}
					/>
				</View>
			)}

			<View className="h-[0.5px] bg-slate-100 my-2" />

			{/* Travel Preferences Section */}
			<Text className="text-sm font-bold text-slate-400 tracking-wider uppercase">
				Travel & Seat Preferences
			</Text>

			{/* Seat Preference */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Preferred Seat Location</Text>
				<View className="flex-row gap-2">
					{(["WINDOW", "AISLE", "NONE"] as const).map((seat) => {
						const isSelected = initialData.preferredSeat === seat;
						return (
							<Pressable
								key={seat}
								onPress={() => onChange({ ...initialData, preferredSeat: seat })}
								className={`flex-1 py-2.5 items-center rounded-xl border ${
									isSelected
										? "border-pink-500 bg-pink-50"
										: "border-slate-200 bg-slate-50"
								}`}
							>
								<Text className={`text-xs ${isSelected ? "font-bold text-pink-600" : "font-medium text-slate-700"}`}>
									{seat === "WINDOW" ? "Window" : seat === "AISLE" ? "Aisle" : "No Preference"}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>

			{/* Class Preference */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Preferred Travel Class</Text>
				<View className="flex-row gap-2">
					{(["ECONOMY", "STANDARD", "VIP"] as const).map((cls) => {
						const isSelected = initialData.preferredClass === cls;
						return (
							<Pressable
								key={cls}
								onPress={() => onChange({ ...initialData, preferredClass: cls })}
								className={`flex-1 py-2.5 items-center rounded-xl border ${
									isSelected
										? "border-pink-500 bg-pink-50"
										: "border-slate-200 bg-slate-50"
								}`}
							>
								<Text className={`text-xs ${isSelected ? "font-bold text-pink-600" : "font-medium text-slate-700"}`}>
									{cls === "VIP" ? "VIP Class" : cls === "STANDARD" ? "Standard" : "Economy"}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>

			{/* Marketing Opt-in */}
			<View className="flex-row items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 mt-1">
				<View className="flex-1 pr-3">
					<Text className="text-sm font-semibold text-slate-900">Promotional Updates & Deals</Text>
					<Text className="text-sm text-slate-500 mt-0.5">Receive special route discounts & promo rewards</Text>
				</View>
				<Switch
					value={initialData.marketingOptIn}
					onValueChange={(val) => onChange({ ...initialData, marketingOptIn: val })}
					trackColor={{ false: "#e2e8f0", true: "#ee237c" }}
					thumbColor="#ffffff"
				/>
			</View>
		</View>
	);
}
