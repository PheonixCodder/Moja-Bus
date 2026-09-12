import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { DriverFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export type ServiceMode = "ALL" | "INTERCITY" | "URBAN";

interface ModeSwitcherProps {
	mode: ServiceMode;
	onModeChange: (mode: ServiceMode) => void;
}

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
	const { t } = useTranslation("trips");
	const MODES: Array<{ key: ServiceMode; label: string }> = [
		{ key: "ALL", label: t("modeAll") },
		{ key: "INTERCITY", label: t("modeIntercity") },
		{ key: "URBAN", label: t("modeUrban") },
	];

	return (
		<View className="flex-row bg-card p-1 rounded-xl border border-border">
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
						accessibilityRole="button"
						accessibilityState={{ selected: isSelected }}
						accessibilityLabel={item.label}
						className={cn("px-2.5 py-1 rounded-lg", isSelected && "bg-primary")}
					>
						<Text
							className={cn(
								"text-[11px] font-bold",
								isSelected ? "text-primary-foreground" : "text-muted-foreground",
							)}
						>
							{item.label}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}
