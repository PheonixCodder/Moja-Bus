import { PlusSignIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation("settings");
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
				idType: form.idType,
				idNumber: form.idNumber || undefined,
				dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : undefined,
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
				idType: form.idType,
				idNumber: form.idNumber || undefined,
				dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : undefined,
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
				onError: () => {
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
			<View className="flex-1 items-center justify-center bg-white">
				<ActivityIndicator size="large" color="#ee237c" />
			</View>
		);
	}

	if (!isAuth) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<Text className="text-base text-slate-500">{t("signInToView")}</Text>
			</View>
		);
	}

	const passengers = data?.items ?? [];
	const selfPassenger = passengers.find((p) => p.isSelf);
	const others = passengers.filter((p) => !p.isSelf);

	return (
		<View className="flex-1 bg-white">
			<SubpageHeader title={t("passengersLabel")} />

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: 8,
					paddingBottom: 100,
					gap: 12,
				}}
			>
				{passengers.length === 0 ? (
					<View className="flex-1 items-center justify-center py-20 gap-4">
						<View className="w-18 h-18 rounded-full bg-pink-50 items-center justify-center">
							<View className="w-14 h-14 rounded-full bg-pink-100 items-center justify-center">
								<HugeiconsIcon icon={UserGroupIcon} size={28} color="#ee237c" />
							</View>
						</View>
						<View className="items-center gap-1">
							<Text className="text-base font-medium text-slate-500">{t("signInToView")}</Text>
							<Text className="text-sm text-slate-400 text-center max-w-[280px] leading-[18px]">
								{t("travelCompanionDescription")}
							</Text>
						</View>
						<Pressable
							onPress={openCreate}
							className="flex-row items-center gap-1 px-6 py-3.5 rounded-2xl bg-pink-600 mt-1 shadow-lg shadow-pink-500/40 active:opacity-85"
						>
							<HugeiconsIcon icon={PlusSignIcon} size={18} color="#fff" />
							<Text className="text-sm font-bold text-white">{t("addFirstTraveler")}</Text>
						</Pressable>
					</View>
				) : (
					<>
						<View className="flex-row items-center justify-between pb-2">
							<Text className="text-xs font-bold text-slate-400 tracking-wide uppercase">
								{passengers.length} {passengers.length === 1 ? "Passenger" : "Passengers"}
							</Text>
						</View>

						{selfPassenger ? (
							<>
								<Text className="text-sm font-bold text-slate-400 tracking-wide uppercase -mb-1">
									{t("myProfileLabel")}
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
									className={`text-sm font-bold text-slate-400 tracking-wide uppercase -mb-1 ${selfPassenger ? "mt-2" : ""}`}
								>
									{t("travelCompanions")}
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

			{/* FAB */}
			<Pressable
				onPress={openCreate}
				className="absolute right-5 w-14 h-14 rounded-full bg-pink-600 items-center justify-center shadow-xl shadow-pink-500/40 active:opacity-85"
				style={{ bottom: BottomTabInset + insets.bottom + 20 }}
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
								idType: (editingPassenger.idType as any) ?? "national_id",
								idNumber: editingPassenger.idNumber ?? "",
								dateOfBirth: editingPassenger.dateOfBirth
									? new Date(editingPassenger.dateOfBirth).toISOString()
									: "",
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
