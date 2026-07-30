import { PlusSignIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import type { SavedPassengerDTO } from "@/hooks/use-passengers";
import {
	useCreateSavedPassenger,
	useDeleteSavedPassenger,
	useSavedPassengers,
	useUpdateSavedPassenger,
} from "@/hooks/use-passengers";
import { authClient } from "@/lib/auth-client";
import { PassengerCard } from "../components/passenger-card";
import { PassengerDeleteSheet } from "../components/passenger-delete-sheet";
import type { PassengerFormData } from "../components/passenger-form-sheet";
import { PassengerFormSheet } from "../components/passenger-form-sheet";

export function PassengersView() {
	const insets = useSafeAreaInsets();
	const queryClient = useQueryClient();

	const { data: session, isPending: sessionPending } = authClient.useSession();
	const isAuth = !!session?.user;

	const { data, isLoading } = useSavedPassengers(isAuth);
	const createMutation = useCreateSavedPassenger();
	const updateMutation = useUpdateSavedPassenger();
	const deleteMutation = useDeleteSavedPassenger();

	const [sheetOpen, setSheetOpen] = useState(false);
	const [editingPassenger, setEditingPassenger] =
		useState<SavedPassengerDTO | null>(null);
	const [deletingPassenger, setDeletingPassenger] =
		useState<SavedPassengerDTO | null>(null);

	const invalidate = useCallback(() => {
		queryClient.invalidateQueries();
	}, [queryClient]);

	const handleCreate = (form: PassengerFormData) => {
		createMutation.mutate(
			{
				fullName: form.fullName,
				phone: form.phone,
				email: form.email || undefined,
				label: form.label || undefined,
			},
			{
				onSuccess: () => {
					setSheetOpen(false);
					setEditingPassenger(null);
					invalidate();
				},
				onError: () => {},
			},
		);
	};

	const handleUpdate = (form: PassengerFormData) => {
		if (!editingPassenger) return;
		updateMutation.mutate(
			{
				id: editingPassenger.id,
				fullName: form.fullName,
				phone: form.phone,
				email: form.email || undefined,
				label: form.label || undefined,
			},
			{
				onSuccess: () => {
					setSheetOpen(false);
					setEditingPassenger(null);
					invalidate();
				},
				onError: () => {
					setEditingPassenger(null);
				},
			},
		);
	};

	const handleDelete = (id: string) => {
		const passenger = passengers.find((p) => p.id === id);
		if (passenger) setDeletingPassenger(passenger);
	};

	const confirmDelete = () => {
		if (!deletingPassenger) return;
		deleteMutation.mutate(
			{ id: deletingPassenger.id },
			{
				onSuccess: () => {
					setDeletingPassenger(null);
					invalidate();
				},
				onError: (err) => {
					setDeletingPassenger(null);
				},
			},
		);
	};

	const openCreate = () => {
		setEditingPassenger(null);
		setSheetOpen(true);
	};

	const openEdit = (passenger: SavedPassengerDTO) => {
		setEditingPassenger(passenger);
		setSheetOpen(true);
	};

	if (sessionPending || isLoading) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: Colors.light.background,
				}}
			>
				<ActivityIndicator size="large" color={Colors.light.primary} />
			</View>
		);
	}

	if (!isAuth) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: Colors.light.background,
				}}
			>
				<Text style={{ color: Colors.light.textSecondary, fontSize: 15 }}>
					Sign in to view your passengers
				</Text>
			</View>
		);
	}

	const passengers = data?.items ?? [];
	const selfPassenger = passengers.find((p) => p.isSelf);
	const others = passengers.filter((p) => !p.isSelf);

	return (
		<View style={{ flex: 1, backgroundColor: Colors.light.background }}>
			<SubpageHeader title="Passengers" />

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingHorizontal: Spacing.four,
					paddingTop: Spacing.two,
					paddingBottom: 100,
					gap: Spacing.three,
				}}
			>
				{passengers.length === 0 ? (
					<View
						style={{
							flex: 1,
							alignItems: "center",
							justifyContent: "center",
							paddingVertical: 80,
							gap: Spacing.four,
						}}
					>
						<View
							style={{
								width: 72,
								height: 72,
								borderRadius: 36,
								backgroundColor: "rgba(238, 35, 124, 0.1)",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<View
								style={{
									width: 56,
									height: 56,
									borderRadius: 28,
									backgroundColor: "rgba(238, 35, 124, 0.15)",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<HugeiconsIcon
									icon={UserGroupIcon}
									size={28}
									color={Colors.light.primary}
								/>
							</View>
						</View>
						<View style={{ alignItems: "center", gap: Spacing.one }}>
							<Text
								style={{
									fontSize: 17,
									fontWeight: "800",
									color: Colors.light.text,
								}}
							>
								No saved passengers
							</Text>
							<Text
								style={{
									fontSize: 13,
									fontWeight: "400",
									color: Colors.light.textSecondary,
									textAlign: "center",
									maxWidth: 280,
									lineHeight: 18,
								}}
							>
								Add your frequent travel companions so you can book seats for
								them in a tap
							</Text>
						</View>
						<Pressable
							onPress={openCreate}
							style={({ pressed }) => ({
								flexDirection: "row",
								alignItems: "center",
								gap: Spacing.one,
								paddingHorizontal: 24,
								paddingVertical: 14,
								borderRadius: 14,
								backgroundColor: Colors.light.primary,
								opacity: pressed ? 0.85 : 1,
								marginTop: Spacing.one,
								shadowColor: Colors.light.primary,
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.3,
								shadowRadius: 12,
								elevation: 8,
							})}
						>
							<HugeiconsIcon icon={PlusSignIcon} size={18} color="#fff" />
							<Text
								style={{
									fontSize: 14,
									fontWeight: "700",
									color: "#fff",
								}}
							>
								Add First Traveler
							</Text>
						</Pressable>
					</View>
				) : (
					<>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								paddingBottom: Spacing.two,
							}}
						>
							<Text
								style={{
									fontSize: 12,
									fontWeight: "700",
									color: Colors.light.textSecondary,
									letterSpacing: 0.5,
									textTransform: "uppercase",
								}}
							>
								{passengers.length}{" "}
								{passengers.length === 1 ? "Passenger" : "Passengers"}
							</Text>
						</View>

						{selfPassenger ? (
							<>
								<Text
									style={{
										fontSize: 11,
										fontWeight: "700",
										color: Colors.light.textSecondary,
										letterSpacing: 0.5,
										textTransform: "uppercase",
										marginBottom: -Spacing.one,
									}}
								>
									My Profile
								</Text>
								<PassengerCard
									key={selfPassenger.id}
									passenger={selfPassenger}
									onEdit={openEdit}
									onDelete={handleDelete}
									isDeleting={deleteMutation.isPending}
								/>
							</>
						) : null}

						{others.length > 0 ? (
							<>
								<Text
									style={{
										fontSize: 11,
										fontWeight: "700",
										color: Colors.light.textSecondary,
										letterSpacing: 0.5,
										textTransform: "uppercase",
										marginTop: selfPassenger ? Spacing.two : 0,
										marginBottom: -Spacing.one,
									}}
								>
									Travel Companions
								</Text>
								{others.map((passenger) => (
									<PassengerCard
										key={passenger.id}
										passenger={passenger}
										onEdit={openEdit}
										onDelete={handleDelete}
										isDeleting={deleteMutation.isPending}
									/>
								))}
							</>
						) : null}
					</>
				)}
			</ScrollView>

			<Pressable
				onPress={openCreate}
				style={({ pressed }) => ({
					position: "absolute",
					bottom: BottomTabInset + insets.bottom + 20,
					right: 20,
					width: 56,
					height: 56,
					borderRadius: 28,
					backgroundColor: Colors.light.primary,
					alignItems: "center",
					justifyContent: "center",
					opacity: pressed ? 0.85 : 1,
					shadowColor: Colors.light.primary,
					shadowOffset: { width: 0, height: 6 },
					shadowOpacity: 0.35,
					shadowRadius: 16,
					elevation: 10,
				})}
			>
				<HugeiconsIcon icon={PlusSignIcon} size={24} color="#fff" />
			</Pressable>

			<PassengerFormSheet
				isOpen={sheetOpen}
				onClose={() => {
					setSheetOpen(false);
					setEditingPassenger(null);
				}}
				onSubmit={editingPassenger ? handleUpdate : handleCreate}
				isPending={createMutation.isPending || updateMutation.isPending}
				initialData={
					editingPassenger
						? {
								fullName: editingPassenger.fullName,
								phone: editingPassenger.phone,
								email: editingPassenger.email ?? "",
								label: editingPassenger.label ?? "",
							}
						: null
				}
			/>

			<PassengerDeleteSheet
				isOpen={!!deletingPassenger}
				passengerName={deletingPassenger?.fullName ?? ""}
				isPending={deleteMutation.isPending}
				onClose={() => setDeletingPassenger(null)}
				onConfirm={confirmDelete}
			/>
		</View>
	);
}
