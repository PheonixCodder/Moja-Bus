import React, { useState } from "react";
import {
	View,
	Text,
	Modal,
	Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CounterSheetProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (input: {
		counterSalaryCFA: number;
		counterStartDate?: string;
		note?: string;
	}) => void;
	submitting: boolean;
}

export function CounterSheet({
	open,
	onClose,
	onSubmit,
	submitting,
}: CounterSheetProps) {
	const { t } = useTranslation("offers");
	const [salary, setSalary] = useState("");
	const [startDate, setStartDate] = useState("");
	const [note, setNote] = useState("");

	const salaryNum = Number(salary.replace(/[^\d]/g, ""));
	const valid = Number.isFinite(salaryNum) && salaryNum >= 1000;

	const reset = () => {
		setSalary("");
		setStartDate("");
		setNote("");
	};

	return (
		<Modal
			visible={open}
			transparent
			animationType="slide"
			onRequestClose={() => {
				reset();
				onClose();
			}}
		>
			<Pressable
				className="flex-1 bg-black/60"
				onPress={() => {
					reset();
					onClose();
				}}
			/>
			<View className="bg-card border-t border-border rounded-t-3xl px-5 pt-3 pb-9 gap-3.5">
				<View className="self-center h-1 w-11 rounded-full bg-zinc-700 mb-1" />
				<Text className="text-lg font-extrabold text-foreground tracking-tight">
					{t("counter.title")}
				</Text>
				<Text className="text-xs text-muted-foreground leading-4">
					{t("counter.subtitle")}
				</Text>

				<Input
					label={t("counter.salaryLabel")}
					keyboardType="number-pad"
					placeholder={t("counter.salaryPlaceholder")}
					value={salary}
					onChangeText={setSalary}
				/>

				<Input
					label={t("counter.startDateLabel")}
					placeholder={t("counter.startDatePlaceholder")}
					value={startDate}
					onChangeText={setStartDate}
				/>

				<View className="w-full gap-1.5">
					<Text className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
						{t("counter.noteLabel")}
					</Text>
					<Input
						className="min-h-[76px] py-3 items-start"
						multiline
						numberOfLines={3}
						maxLength={2000}
						placeholder={t("counter.notePlaceholder")}
						value={note}
						onChangeText={setNote}
					/>
				</View>

				<View className="flex-row gap-3 pt-1.5">
					<Button
						title={t("counter.cancel")}
						variant="outline"
						size="md"
						onPress={() => {
							reset();
							onClose();
						}}
						className="flex-1"
					/>
					<Button
						title={t("counter.submit")}
						variant="primary"
						size="md"
						disabled={!valid || submitting}
						loading={submitting}
						onPress={() => {
							if (!valid) return;
							onSubmit({
								counterSalaryCFA: salaryNum,
								counterStartDate: startDate || undefined,
								note: note.trim() || undefined,
							});
							reset();
						}}
						className="flex-1"
					/>
				</View>
			</View>
		</Modal>
	);
}
