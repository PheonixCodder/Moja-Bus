import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LegalDocument01Icon } from "@hugeicons/core-free-icons";

type LegalTab = "terms" | "privacy" | "operator";

export function TermsPrivacyView() {
	const insets = useSafeAreaInsets();
	const [activeTab, setActiveTab] = useState<LegalTab>("terms");

	return (
		<View className="flex-1 bg-white">
			<SubpageHeader title="Terms & Privacy" />

			{/* Tab Selector Strip */}
			<View className="px-4 pt-2">
				<View className="flex-row bg-black/[0.04] rounded-2xl p-1">
					{(["terms", "privacy", "operator"] as LegalTab[]).map((tab) => {
						const isActive = activeTab === tab;
						const label = tab === "terms" ? "Terms of Use" : tab === "privacy" ? "Privacy Policy" : "Disclosures";
						return (
							<Pressable
								key={tab}
								onPress={() => setActiveTab(tab)}
								className={`will-change-variable will-change-pressable flex-1 py-2 items-center rounded-xl ${isActive ? "bg-white shadow shadow-black/10" : ""}`}
							>
								<Text className={`will-change-variable text-sm ${isActive ? "font-bold text-pink-600" : "font-medium text-slate-500"}`}>
									{label}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: 16,
					paddingBottom: BottomTabInset + insets.bottom + 24,
				}}
			>
				<View className="bg-white rounded-[20px] border border-slate-100 p-4 gap-3 shadow-sm shadow-black/5">
					<View className="flex-row items-center gap-2.5">
						<HugeiconsIcon icon={LegalDocument01Icon} size={22} color="#ee237c" />
						<Text className="text-base font-bold text-slate-900">
							{activeTab === "terms"
								? "Moja Ride Passenger Terms of Service"
								: activeTab === "privacy"
									? "Data Privacy & Security Policy"
									: "Operator Compliance & Commission Disclosures"}
						</Text>
					</View>

					<Text className="text-[11px] font-semibold text-slate-400">
						Last Updated: January 2026 • Version 2.1
					</Text>

					<View className="h-[0.5px] bg-slate-100" />

					{activeTab === "terms" ? (
						<View className="gap-3">
							<Text className="text-sm font-bold text-slate-900">1. Acceptance of Booking Terms</Text>
							<Text className="text-sm text-slate-500 leading-5">
								By booking tickets or using Moja Wallet through the Traveler App, you agree to comply with transport operator rules, station safety procedures, and boarding window times.
							</Text>
							<Text className="text-sm font-bold text-slate-900">2. Seat Reservations & Digital Boarding</Text>
							<Text className="text-sm text-slate-500 leading-5">
								Hold reservations guarantee seat availability for 10 minutes while completing Mobile Money top-up. Confirmed bookings generate a unique QR code valid for terminal validation.
							</Text>
						</View>
					) : activeTab === "privacy" ? (
						<View className="gap-3">
							<Text className="text-sm font-bold text-slate-900">1. Collection of Passenger Data</Text>
							<Text className="text-sm text-slate-500 leading-5">
								We collect passenger names, phone numbers, and optional identity documents strictly for manifest verification and passenger safety regulations.
							</Text>
							<Text className="text-sm font-bold text-slate-900">2. Payment Protection</Text>
							<Text className="text-sm text-slate-500 leading-5">
								All financial transactions are processed using Paystack PCI-DSS compliant infrastructure. Credit card details are never stored on local app devices.
							</Text>
						</View>
					) : (
						<View className="gap-3">
							<Text className="text-sm font-bold text-slate-900">1. Licensed Transport Operators</Text>
							<Text className="text-sm text-slate-500 leading-5">
								All intercity bus operators listed on Moja Ride maintain valid transport permits and vehicle insurance coverage.
							</Text>
							<Text className="text-sm font-bold text-slate-900">2. Refunds & Cancellation Ledger</Text>
							<Text className="text-sm text-slate-500 leading-5">
								Cancellations are credited directly back to your Moja Wallet or issued as an operator trip voucher per standard fare rules.
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
}
