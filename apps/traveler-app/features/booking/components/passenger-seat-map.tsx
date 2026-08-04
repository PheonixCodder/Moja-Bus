import { Colors, Spacing } from "@moja/theme/tokens";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

type SeatStatus =
	| "AVAILABLE"
	| "HELD"
	| "SOLD"
	| "BLOCKED"
	| "DRIVER"
	| "EMPTY";

type SeatGridItem = {
	id: string;
	label: string;
	row: number;
	col: number;
	status: SeatStatus;
	priceXOF?: number;
};

type PassengerSeatMapProps = {
	seats: SeatGridItem[];
	selectedSeats: string[];
	onSelectSeat: (seatId: string) => void;
	rows?: number;
	columns?: number;
};

const STATUS_COLORS: Record<SeatStatus, string> = {
	AVAILABLE: "#10b981",
	HELD: "#f59e0b",
	SOLD: "#ef4444",
	BLOCKED: "#9ca3af",
	DRIVER: "#6366f1",
	EMPTY: "#e2e8f0",
};

const STATUS_LABELS: Record<SeatStatus, string> = {
	AVAILABLE: "Available",
	HELD: "Held",
	SOLD: "Sold",
	BLOCKED: "Blocked",
	DRIVER: "Driver",
	EMPTY: "Empty",
};

function getColumnHeader(index: number): string {
	return String.fromCharCode(65 + index);
}

export function PassengerSeatMap({
	seats,
	selectedSeats,
	onSelectSeat,
	rows = 5,
	columns = 4,
}: PassengerSeatMapProps) {
	const grid: (SeatGridItem | null)[][] = [];
	for (let r = 0; r < rows; r++) {
		grid[r] = [];
		for (let c = 0; c < columns; c++) {
			const seat = seats.find((s) => s.row === r && s.col === c);
			grid[r]?.push(seat ?? null);
		}
	}

	return (
		<View style={{ gap: Spacing.three }}>
			<View
				style={{
					flexDirection: "row",
					paddingLeft: 32,
					gap: 4,
				}}
			>
				{Array.from({ length: columns }).map((_, i) => (
					<View
						key={i}
						style={{
							flex: 1,
							alignItems: "center",
						}}
					>
						<Text
							style={{
								fontSize: 11,
								fontWeight: "700",
								color: Colors.light.textSecondary,
							}}
						>
							{getColumnHeader(i)}
						</Text>
					</View>
				))}
			</View>

			{grid.map((row, rowIndex) => (
				<View
					key={rowIndex}
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 4,
					}}
				>
					<View
						style={{
							width: 28,
							alignItems: "flex-end",
							paddingRight: Spacing.two,
						}}
					>
						<Text
							style={{
								fontSize: 11,
								fontWeight: "600",
								color: Colors.light.textSecondary,
							}}
						>
							{rowIndex + 1}
						</Text>
					</View>

					{row.map((seat, colIndex) => {
						if (!seat) {
							return (
								<View
									key={`empty-${rowIndex}-${colIndex}`}
									style={{
										flex: 1,
										height: 36,
										borderRadius: 8,
										backgroundColor: Colors.light.backgroundElement,
										borderWidth: 1,
										borderColor: Colors.light.backgroundSelected,
									}}
								/>
							);
						}

						const isSelected = selectedSeats.includes(seat.id);
						const isAvailable = seat.status === "AVAILABLE";

						return (
							<Pressable
								key={seat.id}
								onPress={() =>
									isAvailable ? onSelectSeat(seat.id) : undefined
								}
								disabled={!isAvailable}
								style={({ pressed }) => ({
									flex: 1,
									height: 36,
									borderRadius: 8,
									backgroundColor: isSelected
										? Colors.light.primary
										: STATUS_COLORS[seat.status],
									alignItems: "center",
									justifyContent: "center",
									opacity: isAvailable ? (pressed ? 0.8 : 1) : 0.4,
									borderWidth: isSelected ? 2 : 0,
									borderColor: isSelected ? "#fff" : "transparent",
								})}
							>
								<Text
									style={{
										fontSize: 10,
										fontWeight: "700",
										color: isSelected ? "#fff" : "#fff",
									}}
								>
									{seat.label}
								</Text>
							</Pressable>
						);
					})}
				</View>
			))}

			<View
				style={{
					flexDirection: "row",
					flexWrap: "wrap",
					gap: Spacing.two,
					paddingTop: Spacing.three,
					borderTopWidth: 1,
					borderTopColor: Colors.light.backgroundSelected,
				}}
			>
				{(
					[
						["AVAILABLE", "#10b981"],
						["HELD", "#f59e0b"],
						["SOLD", "#ef4444"],
						["BLOCKED", "#9ca3af"],
					] as const
				).map(([status, color]) => (
					<View
						key={status}
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 4,
						}}
					>
						<View
							style={{
								width: 12,
								height: 12,
								borderRadius: 3,
								backgroundColor: color,
							}}
						/>
						<Text
							style={{
								fontSize: 10,
								fontWeight: "600",
								color: Colors.light.textSecondary,
							}}
						>
							{STATUS_LABELS[status as SeatStatus]}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
