import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { DriverFeedback } from "@/lib/haptics";

export type ServiceMode = "ALL" | "INTERCITY" | "URBAN";

interface ModeSwitcherProps {
	mode: ServiceMode;
	onModeChange: (mode: ServiceMode) => void;
}

const MODES: Array<{ key: ServiceMode; label: string }> = [
	{ key: "ALL", label: "Tous" },
	{ key: "INTERCITY", label: "Interurbain" },
	{ key: "URBAN", label: "Urbain" },
];

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
	return (
		<View style={styles.container}>
			{MODES.map((item) => {
				const isSelected = mode === item.key;
				return (
					<TouchableOpacity
						key={item.key}
						onPress={() => {
							DriverFeedback.tap();
							onModeChange(item.key);
						}}
						activeOpacity={0.8}
						style={[styles.chip, isSelected && styles.chipSelected]}
					>
						<Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
							{item.label}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: "#18181b",
		padding: 3,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#27272a",
	},
	chip: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 8,
	},
	chipSelected: {
		backgroundColor: "#ee237c",
	},
	chipText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#a1a1aa",
	},
	chipTextSelected: {
		color: "#ffffff",
	},
});
