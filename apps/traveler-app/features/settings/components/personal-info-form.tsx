import { useState } from "react";
import { Platform, Pressable, TextInput, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

export interface PersonalInfoFormData {
	fullName: string;
	phone: string;
	dateOfBirth: string;
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
		if (Platform.OS === "android") {
			setShowDatePicker(false);
		}
		if (selectedDate) {
			onChange({ ...initialData, dateOfBirth: selectedDate.toISOString() });
		}
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

	const inputStyle = {
		backgroundColor: Colors.light.backgroundElement,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.light.backgroundSelected,
		paddingHorizontal: Spacing.four,
		paddingVertical: Spacing.two,
		fontSize: 14,
		fontWeight: "600" as const,
		color: Colors.light.text,
	};

	const labelStyle = {
		fontSize: 10,
		fontWeight: "700" as const,
		color: Colors.light.textSecondary,
		letterSpacing: 1,
		textTransform: "uppercase" as const,
		marginBottom: Spacing.one,
	};

	return (
		<View style={{ gap: Spacing.four }}>
			<View style={{ gap: Spacing.one }}>
				<Text style={labelStyle}>Full Name</Text>
				<TextInput
					value={initialData.fullName}
					onChangeText={(val) => onChange({ ...initialData, fullName: val })}
					placeholder="Enter your full name"
					placeholderTextColor={Colors.light.textSecondary}
					style={inputStyle}
					autoCapitalize="words"
				/>
			</View>

			<View style={{ gap: Spacing.one }}>
				<Text style={labelStyle}>Email Address</Text>
				<View style={[inputStyle, { flexDirection: "row", alignItems: "center", opacity: 0.6 }]}>
					<TextInput
						value={email}
						editable={false}
						style={{
							flex: 1,
							fontSize: 14,
							fontWeight: "600",
							color: Colors.light.text,
						}}
					/>
				</View>
				<Text style={{ fontSize: 10, color: Colors.light.textSecondary, marginTop: 2 }}>
					Registered email address cannot be changed.
				</Text>
			</View>

			<View style={{ gap: Spacing.one }}>
				<Text style={labelStyle}>Phone Number</Text>
				<TextInput
					value={initialData.phone}
					onChangeText={(val) => onChange({ ...initialData, phone: val })}
					placeholder="Enter your phone number"
					placeholderTextColor={Colors.light.textSecondary}
					style={inputStyle}
					keyboardType="phone-pad"
				/>
			</View>

			<View style={{ gap: Spacing.one }}>
				<Text style={labelStyle}>Date of Birth</Text>
				<Pressable onPress={openDatePicker} style={inputStyle}>
					<Text style={{ fontSize: 14, fontWeight: "600", color: initialData.dateOfBirth ? Colors.light.text : Colors.light.textSecondary }}>
						{initialData.dateOfBirth ? formatDate(initialData.dateOfBirth) : "Select your date of birth"}
					</Text>
				</Pressable>
			</View>

			{showDatePicker && Platform.OS === "ios" && (
				<View style={{ backgroundColor: Colors.light.backgroundElement, borderRadius: 12, overflow: "hidden" }}>
					<DateTimePicker
						value={dateObj}
						mode="date"
						display="spinner"
						maximumDate={new Date()}
						onChange={handleDateChange}
					/>
				</View>
			)}
		</View>
	);
}
