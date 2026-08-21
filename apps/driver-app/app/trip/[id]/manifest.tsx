import { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
	Search,
	CheckCircle,
	Circle,
	Armchair,
	Phone,
	User,
} from "lucide-react-native";
import { DriverFeedback } from "@/lib/haptics";

export default function PassengerManifestScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const [search, setSearch] = useState("");
	const [boardedMap, setBoardedMap] = useState<Record<string, boolean>>({
		"1": true,
		"2": true,
		"3": false,
	});

	const passengers = [
		{ id: "1", name: "Amadou Diallo", phone: "+225 07 48 29 10", seat: "01A" },
		{ id: "2", name: "Fatou Traoré", phone: "+225 05 12 84 93", seat: "01B" },
		{ id: "3", name: "Kouamé N'Guessan", phone: "+225 01 92 73 84", seat: "02A" },
		{ id: "4", name: "Aïcha Bakayoko", phone: "+225 07 55 44 33", seat: "02B" },
		{ id: "5", name: "Jean-Baptiste Koffi", phone: "+225 05 66 77 88", seat: "03A" },
	];

	const toggleBoarding = (passengerId: string) => {
		DriverFeedback.tap();
		setBoardedMap((prev: Record<string, boolean>) => ({
			...prev,
			[passengerId]: !prev[passengerId],
		}));
	};

	const filtered = passengers.filter(
		(p) =>
			p.name.toLowerCase().includes(search.toLowerCase()) ||
			p.seat.toLowerCase().includes(search.toLowerCase())
	);

	const boardedCount = Object.values(boardedMap).filter(Boolean).length;

	return (
		<View className="flex-1 bg-zinc-950">
			{/* Manifest Search & Stats */}
			<View className="p-4 bg-zinc-900 border-b border-zinc-800 space-y-3">
				<View className="flex-row items-center justify-between">
					<Text className="text-xs font-bold text-zinc-400">
						Boarding Progress
					</Text>
					<Text className="text-xs font-bold text-rose-500 font-mono">
						{boardedCount} / {passengers.length} Boarded
					</Text>
				</View>

				<View className="flex-row items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11">
					<Search size={16} color="#71717a" />
					<TextInput
						className="flex-1 ml-2.5 text-white text-xs"
						placeholder="Search by passenger name or seat number..."
						placeholderTextColor="#52525b"
						value={search}
						onChangeText={setSearch}
					/>
				</View>
			</View>

			{/* Passengers List */}
			<ScrollView className="flex-1 p-4 divide-y divide-zinc-800/80">
				{filtered.map((p) => {
					const isBoarded = !!boardedMap[p.id];
					return (
						<TouchableOpacity
							key={p.id}
							onPress={() => toggleBoarding(p.id)}
							className="py-3.5 flex-row items-center justify-between"
						>
							<View className="flex-row items-center gap-3">
								<View className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center">
									<Text className="text-xs font-mono font-bold text-rose-500">
										{p.seat}
									</Text>
								</View>
								<View>
									<Text className="text-sm font-bold text-white">{p.name}</Text>
									<Text className="text-xs text-zinc-500">{p.phone}</Text>
								</View>
							</View>

							<View className="flex-row items-center gap-2">
								{isBoarded ? (
									<CheckCircle size={22} color="#10b981" />
								) : (
									<Circle size={22} color="#52525b" />
								)}
							</View>
						</TouchableOpacity>
					);
				})}
			</ScrollView>
		</View>
	);
}
