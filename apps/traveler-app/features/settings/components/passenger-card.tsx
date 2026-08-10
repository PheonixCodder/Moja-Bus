import {
	CallIcon,
	Delete01Icon,
	Mail01Icon,
	PencilEdit02Icon,
	Tag01Icon,
	LegalDocument01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
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

function getIdTypeLabel(type?: string | null) {
	if (type === "passport") return "Passport";
	if (type === "driver_license") return "Driver License";
	return "National ID";
}

export function PassengerCard({
	passenger,
	onEdit,
	onDelete,
	isDeleting,
}: PassengerCardProps) {
	const [bgColor, textColor] = getAvatarPair(passenger.fullName);

	return (
		<View className="bg-white rounded-[20px] p-4 border border-slate-100 gap-3 shadow-sm shadow-black/5">
			{/* Header row */}
			<View className="flex-row items-center gap-3">
				{/* Avatar */}
				<View
					className="w-11 h-11 rounded-full items-center justify-center"
					style={{ backgroundColor: bgColor }}
				>
					<Text style={{ fontSize: 15, fontWeight: "800", color: textColor }}>
						{getInitials(passenger.fullName)}
					</Text>
				</View>

				{/* Name & metadata */}
				<View className="flex-1 gap-0.5">
					<View className="flex-row items-center gap-1">
						<Text className="text-[15px] font-bold text-slate-900 flex-shrink" numberOfLines={1}>
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
								<Text className="text-[8px] font-black text-pink-600 tracking-wide uppercase">Me</Text>
							</Badge>
						)}
					</View>

					<View className="flex-row items-center gap-1.5 flex-wrap">
						{passenger.label ? (
							<View className="flex-row items-center self-start gap-[3px] px-1.5 py-0.5 rounded bg-slate-100">
								<HugeiconsIcon icon={Tag01Icon} size={9} color="#94a3b8" />
								<Text className="text-[9px] font-bold text-slate-500">{passenger.label}</Text>
							</View>
						) : null}

						{passenger.idNumber ? (
							<View className="flex-row items-center self-start gap-[3px] px-1.5 py-0.5 rounded bg-pink-50">
								<HugeiconsIcon icon={LegalDocument01Icon} size={9} color="#ee237c" />
								<Text className="text-[9px] font-bold text-pink-600">
									{getIdTypeLabel(passenger.idType)}: {passenger.idNumber}
								</Text>
							</View>
						) : null}
					</View>
				</View>

				{/* Action buttons */}
				<View className="flex-row gap-2">
					<Pressable
						onPress={() => onEdit(passenger)}
						hitSlop={8}
						className="w-[34px] h-[34px] rounded-[10px] bg-slate-100 items-center justify-center active:opacity-70"
					>
						<HugeiconsIcon icon={PencilEdit02Icon} size={16} color="#94a3b8" />
					</Pressable>
					{!passenger.isSelf && (
						<Pressable
							onPress={() => onDelete(passenger.id)}
							disabled={isDeleting}
							hitSlop={8}
							className={`w-[34px] h-[34px] rounded-[10px] bg-rose-50 items-center justify-center ${isDeleting ? "opacity-70" : ""} active:opacity-70`}
						>
							<HugeiconsIcon icon={Delete01Icon} size={16} color="#e11d48" />
						</Pressable>
					)}
				</View>
			</View>

			{/* Contact row */}
			<View className="flex-row items-center gap-3 pt-2 border-t border-slate-100">
				<Pressable
					onPress={() => Linking.openURL(`tel:${passenger.phone}`)}
					hitSlop={6}
					className="flex-row items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-500/[0.08] active:opacity-70"
				>
					<HugeiconsIcon icon={CallIcon} size={14} color="#10b981" />
					<Text className="text-xs font-semibold text-emerald-600" numberOfLines={1}>
						{passenger.phone}
					</Text>
				</Pressable>

				{passenger.email ? (
					<Pressable
						onPress={() => Linking.openURL(`mailto:${passenger.email}`)}
						hitSlop={6}
						className="flex-row items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-500/[0.08] active:opacity-70"
					>
						<HugeiconsIcon icon={Mail01Icon} size={14} color="#6366f1" />
						<Text className="text-xs font-semibold text-indigo-500" numberOfLines={1}>
							{passenger.email}
						</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}
