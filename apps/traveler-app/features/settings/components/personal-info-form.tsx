import { useState } from "react";
import { Platform, Pressable, Switch, TextInput, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Text } from "@/components/ui/text";
import { Palette, Colors } from "@/constants/theme";

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
				<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Full Name</Text>
				<TextInput
					value={initialData.fullName}
					onChangeText={(val) => onChange({ ...initialData, fullName: val })}
					placeholder="Enter your full name"
					placeholderTextColor={Colors.light.textMuted}
					className="bg-background rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
					autoCapitalize="words"
				/>
			</View>

			{/* Email (read-only) */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Email Address</Text>
				<View className="bg-background rounded-xl border border-border px-4 py-2.5 flex-row items-center opacity-60">
					<TextInput
						value={email}
						editable={false}
						className="flex-1 text-sm font-semibold text-foreground"
					/>
				</View>
				<Text className="text-xs text-muted-foreground mt-0.5">Registered email address cannot be changed.</Text>
			</View>

			{/* Phone */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Phone Number (International Format)</Text>
				<TextInput
					value={initialData.phone}
					onChangeText={(val) => onChange({ ...initialData, phone: val })}
					placeholder="+225 07 00 00 00 00"
					placeholderTextColor={Colors.light.textMuted}
					className="bg-background rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
					keyboardType="phone-pad"
				/>
			</View>

			{/* Date of Birth */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Date of Birth</Text>
				<Pressable
					onPress={openDatePicker}
					accessibilityRole="button"
					className="bg-background rounded-xl border border-border px-4 py-2.5 min-h-10 justify-center"
				>
					<Text className={`text-sm font-semibold ${initialData.dateOfBirth ? "text-foreground" : "text-muted-foreground"}`}>
						{initialData.dateOfBirth ? formatDate(initialData.dateOfBirth) : "Select your date of birth"}
					</Text>
				</Pressable>
			</View>

			{showDatePicker && Platform.OS === "ios" && (
				<View className="bg-background rounded-xl overflow-hidden">
					<DateTimePicker
						value={dateObj}
						mode="date"
						display="spinner"
						maximumDate={new Date()}
						onChange={handleDateChange}
					/>
				</View>
			)}

			<View className="h-[0.5px] bg-border my-2" />

			{/* Travel Preferences Section */}
			<Text className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
				Travel & Seat Preferences
			</Text>

			{/* Seat Preference */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Preferred Seat Location</Text>
				<View className="flex-row gap-2">
					{(["WINDOW", "AISLE", "NONE"] as const).map((seat) => {
						const isSelected = initialData.preferredSeat === seat;
						return (
							<Pressable
								key={seat}
								onPress={() => onChange({ ...initialData, preferredSeat: seat })}
								accessibilityRole="button"
								className={`flex-1 py-2.5 items-center rounded-xl border min-h-10 justify-center ${
									isSelected
										? "border-primary bg-primary/10"
										: "border-border bg-muted/40"
								}`}
							>
								<Text className={`text-xs ${isSelected ? "font-bold text-primary" : "font-medium text-foreground"}`}>
									{seat === "WINDOW" ? "Window" : seat === "AISLE" ? "Aisle" : "No Preference"}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>

			{/* Class Preference */}
			<View className="gap-1">
				<Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Preferred Travel Class</Text>
				<View className="flex-row gap-2">
					{(["ECONOMY", "STANDARD", "VIP"] as const).map((cls) => {
						const isSelected = initialData.preferredClass === cls;
						return (
							<Pressable
								key={cls}
								onPress={() => onChange({ ...initialData, preferredClass: cls })}
								accessibilityRole="button"
								className={`flex-1 py-2.5 items-center rounded-xl border min-h-10 justify-center ${
									isSelected
										? "border-primary bg-primary/10"
										: "border-border bg-muted/40"
								}`}
							>
								<Text className={`text-xs ${isSelected ? "font-bold text-primary" : "font-medium text-foreground"}`}>
									{cls === "VIP" ? "VIP Class" : cls === "STANDARD" ? "Standard" : "Economy"}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>

			{/* Marketing Opt-in */}
			<View className="flex-row items-center justify-between bg-card rounded-2xl px-4 py-3 border border-border mt-1">
				<View className="flex-1 pr-3">
					<Text className="text-sm font-semibold text-foreground">Promotional Updates & Deals</Text>
					<Text className="text-sm text-muted-foreground mt-0.5">Receive special route discounts & promo rewards</Text>
				</View>
				<Switch
					value={initialData.marketingOptIn}
					onValueChange={(val) => onChange({ ...initialData, marketingOptIn: val })}
					trackColor={{ false: Palette.zinc[200], true: Palette.rose[500] }}
					thumbColor={Colors.light.background}
				/>
			</View>
		</View>
	);
}
