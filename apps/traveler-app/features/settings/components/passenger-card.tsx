import {
	CallIcon,
	Delete01Icon,
	Mail01Icon,
	PencilEdit02Icon,
	Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
import { Linking, Pressable, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { SavedPassengerDTO } from "@/hooks/use-passengers";

type PassengerCardProps = {
	passenger: SavedPassengerDTO;
	onEdit: (passenger: SavedPassengerDTO) => void;
	onDelete: (id: string) => void;
	isDeleting: boolean;
};

const AVATAR_COLORS = [
	["rgba(99, 102, 241, 0.15)", "#6366f1"],
	["rgba(16, 185, 129, 0.15)", "#10b981"],
	["rgba(245, 158, 11, 0.15)", "#f59e0b"],
	["rgba(168, 85, 247, 0.15)", "#a855f7"],
	["rgba(244, 63, 94, 0.15)", "#f43f5e"],
];

function getInitials(name: string) {
	const parts = name.trim().split(" ").filter(Boolean);
	if (parts.length >= 2) {
		return `${(parts[0]?.[0] ?? "").toUpperCase()}${(parts[1]?.[0] ?? "").toUpperCase()}`;
	}
	return name.slice(0, 2).toUpperCase();
}

function getAvatarPair(name: string) {
	return AVATAR_COLORS[name.length % AVATAR_COLORS.length] as [string, string];
}

export function PassengerCard({
	passenger,
	onEdit,
	onDelete,
	isDeleting,
}: PassengerCardProps) {
	const [bgColor, textColor] = getAvatarPair(passenger.fullName);

	return (
		<View
			style={{
				backgroundColor: Colors.light.background,
				borderRadius: 20,
				padding: Spacing.four,
				borderWidth: 1,
				borderColor: Colors.light.backgroundSelected,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.04,
				shadowRadius: 8,
				elevation: 2,
				gap: Spacing.three,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: Spacing.three,
				}}
			>
				<View
					style={{
						width: 44,
						height: 44,
						borderRadius: 22,
						backgroundColor: bgColor,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text
						style={{
							fontSize: 15,
							fontWeight: "800",
							color: textColor,
						}}
					>
						{getInitials(passenger.fullName)}
					</Text>
				</View>

				<View style={{ flex: 1, gap: 2 }}>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: Spacing.one,
						}}
					>
						<Text
							style={{
								fontSize: 15,
								fontWeight: "700",
								color: Colors.light.text,
							}}
							numberOfLines={1}
						>
							{passenger.fullName}
						</Text>
						{passenger.isSelf && (
							<Badge
								variant="outline"
								className="border-pink-200"
								style={{
									paddingHorizontal: 6,
									paddingVertical: 1,
									borderRadius: 6,
									borderColor: "#f9a8d4",
									backgroundColor: "rgba(251, 207, 232, 0.3)",
								}}
							>
								<Text
									style={{
										fontSize: 8,
										fontWeight: "900",
										color: Colors.light.primary,
										letterSpacing: 0.5,
										textTransform: "uppercase",
									}}
								>
									Me
								</Text>
							</Badge>
						)}
					</View>
					{passenger.label ? (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								alignSelf: "flex-start",
								gap: 3,
								paddingHorizontal: 6,
								paddingVertical: 2,
								borderRadius: 4,
								backgroundColor: Colors.light.backgroundElement,
							}}
						>
							<HugeiconsIcon
								icon={Tag01Icon}
								size={9}
								color={Colors.light.textSecondary}
							/>
							<Text
								style={{
									fontSize: 9,
									fontWeight: "700",
									color: Colors.light.textSecondary,
								}}
							>
								{passenger.label}
							</Text>
						</View>
					) : null}
				</View>

				<View style={{ flexDirection: "row", gap: Spacing.two }}>
					<Pressable
						onPress={() => onEdit(passenger)}
						hitSlop={8}
						style={({ pressed }) => ({
							width: 34,
							height: 34,
							borderRadius: 10,
							backgroundColor: Colors.light.backgroundElement,
							alignItems: "center",
							justifyContent: "center",
							opacity: pressed ? 0.7 : 1,
						})}
					>
						<HugeiconsIcon
							icon={PencilEdit02Icon}
							size={16}
							color={Colors.light.textSecondary}
						/>
					</Pressable>
					{!passenger.isSelf && (
						<Pressable
							onPress={() => onDelete(passenger.id)}
							disabled={isDeleting}
							hitSlop={8}
							style={({ pressed }) => ({
								width: 34,
								height: 34,
								borderRadius: 10,
								backgroundColor: "rgba(244, 63, 94, 0.08)",
								alignItems: "center",
								justifyContent: "center",
								opacity: pressed || isDeleting ? 0.7 : 1,
							})}
						>
							<HugeiconsIcon icon={Delete01Icon} size={16} color="#e11d48" />
						</Pressable>
					)}
				</View>
			</View>

			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: Spacing.three,
					paddingTop: Spacing.two,
					borderTopWidth: 1,
					borderTopColor: Colors.light.backgroundSelected,
				}}
			>
				<Pressable
					onPress={() => Linking.openURL(`tel:${passenger.phone}`)}
					hitSlop={6}
					style={({ pressed }) => ({
						flexDirection: "row",
						alignItems: "center",
						gap: 6,
						paddingVertical: 6,
						paddingHorizontal: 10,
						borderRadius: 8,
						backgroundColor: "rgba(16, 185, 129, 0.08)",
						opacity: pressed ? 0.7 : 1,
					})}
				>
					<HugeiconsIcon icon={CallIcon} size={14} color="#10b981" />
					<Text
						style={{
							fontSize: 12,
							fontWeight: "600",
							color: "#10b981",
						}}
						numberOfLines={1}
					>
						{passenger.phone}
					</Text>
				</Pressable>

				{passenger.email ? (
					<Pressable
						onPress={() => Linking.openURL(`mailto:${passenger.email}`)}
						hitSlop={6}
						style={({ pressed }) => ({
							flexDirection: "row",
							alignItems: "center",
							gap: 6,
							paddingVertical: 6,
							paddingHorizontal: 10,
							borderRadius: 8,
							backgroundColor: "rgba(99, 102, 241, 0.08)",
							opacity: pressed ? 0.7 : 1,
						})}
					>
						<HugeiconsIcon icon={Mail01Icon} size={14} color="#6366f1" />
						<Text
							style={{
								fontSize: 12,
								fontWeight: "600",
								color: "#6366f1",
							}}
							numberOfLines={1}
						>
							{passenger.email}
						</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}
