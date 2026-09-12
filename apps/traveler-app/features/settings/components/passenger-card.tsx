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
import { UserAvatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";
import type { SavedPassengerDTO } from "@/hooks/use-passengers";

type PassengerCardProps = {
	passenger: SavedPassengerDTO;
	onEdit: (passenger: SavedPassengerDTO) => void;
	onDelete: (id: string) => void;
	isDeleting: boolean;
};


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
	return (
		<View className="bg-card rounded-2xl p-4 border border-border gap-3 shadow-sm">
			{/* Header row */}
			<View className="flex-row items-center gap-3">
				{/* Avatar */}
				<UserAvatar
					name={passenger.fullName}
					seed={passenger.id}
					size="md"
					className="w-11 h-11"
				/>

				{/* Name & metadata */}
				<View className="flex-1 gap-0.5">
					<View className="flex-row items-center gap-1">
						<Text className="text-base font-bold text-foreground flex-shrink" numberOfLines={1}>
							{passenger.fullName}
						</Text>
						{passenger.isSelf && (
							<Badge
								variant="outline"
								className="border-primary/30 bg-primary/10 px-1.5 py-0.5"
							>
								<Text className="text-[11px] font-black text-primary tracking-wide uppercase">Me</Text>
							</Badge>
						)}
					</View>

					<View className="flex-row items-center gap-1.5 flex-wrap">
						{passenger.label ? (
							<View className="flex-row items-center self-start gap-1 px-1.5 py-0.5 rounded bg-muted">
								<HugeiconsIcon icon={Tag01Icon} size={9} color={Palette.zinc[400]} />
								<Text className="text-xs font-bold text-muted-foreground">{passenger.label}</Text>
							</View>
						) : null}

						{passenger.idNumber ? (
							<View className="flex-row items-center self-start gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
								<HugeiconsIcon icon={LegalDocument01Icon} size={9} color={Palette.rose[500]} />
								<Text className="text-xs font-bold text-primary">
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
						accessibilityRole="button"
						accessibilityLabel="Edit passenger"
						hitSlop={8}
						className="size-9 rounded-xl bg-muted items-center justify-center active:opacity-70 min-h-9"
					>
						<HugeiconsIcon icon={PencilEdit02Icon} size={16} color={Palette.zinc[400]} />
					</Pressable>
					{!passenger.isSelf && (
						<Pressable
							onPress={() => onDelete(passenger.id)}
							disabled={isDeleting}
							accessibilityRole="button"
							accessibilityLabel="Delete passenger"
							hitSlop={8}
							className={`size-9 rounded-xl bg-destructive/10 items-center justify-center ${isDeleting ? "opacity-70" : ""} active:opacity-70 min-h-9`}
						>
							<HugeiconsIcon icon={Delete01Icon} size={16} color={Palette.red[500]} />
						</Pressable>
					)}
				</View>
			</View>

			{/* Contact row */}
			<View className="flex-row items-center gap-3 pt-2 border-t border-border/40">
				<Pressable
					onPress={() => Linking.openURL(`tel:${passenger.phone}`)}
					accessibilityRole="link"
					hitSlop={6}
					className="flex-row items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-success/10 active:opacity-70 min-h-8"
				>
					<HugeiconsIcon icon={CallIcon} size={14} color={Palette.emerald[500]} />
					<Text className="text-xs font-semibold text-success" numberOfLines={1}>
						{passenger.phone}
					</Text>
				</Pressable>

				{passenger.email ? (
					<Pressable
						onPress={() => Linking.openURL(`mailto:${passenger.email}`)}
						accessibilityRole="link"
						hitSlop={6}
						className="flex-row items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-primary/10 active:opacity-70 min-h-8"
					>
						<HugeiconsIcon icon={Mail01Icon} size={14} color={Palette.rose[500]} />
						<Text className="text-xs font-semibold text-primary" numberOfLines={1}>
							{passenger.email}
						</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}
