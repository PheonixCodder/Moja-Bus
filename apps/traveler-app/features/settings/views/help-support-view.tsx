import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Mail01Icon,
	CallIcon,
	ArrowDown01Icon,
	ArrowUp01Icon,
	HelpCircleIcon,
} from "@hugeicons/core-free-icons";

interface FAQItem {
	id: string;
	question: string;
	answer: string;
}

const FAQS: FAQItem[] = [
	{
		id: "faq-1",
		question: "How do I show my digital ticket at boarding?",
		answer:
			"Open the Tickets tab in the Traveler App or navigate to Bookings. Your digital ticket features a dynamic QR code and seat number. Simply present this to the bus conductor or station staff before boarding.",
	},
	{
		id: "faq-2",
		question: "How do wallet deposits work?",
		answer:
			"You can deposit funds into your Moja Wallet using Mobile Money (Paystack). Go to Settings → Wallet → Top Up, select an amount, and complete the instant verification.",
	},
	{
		id: "faq-3",
		question: "What is the cancellation and refund policy?",
		answer:
			"Cancellations made more than 2 hours before trip departure qualify for a full wallet refund or voucher refund, according to the operator's settlement policy.",
	},
	{
		id: "faq-4",
		question: "Can I book a seat for a companion?",
		answer:
			"Yes! You can add travel companions under Settings → Saved Passengers. When booking a trip, select their profile from your saved passengers list.",
	},
];

export function HelpSupportView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("settings");
	const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");

	const toggleFaq = (id: string) => {
		setExpandedFaq((current) => (current === id ? null : id));
	};

	const handleCallSupport = () => {
		Linking.openURL("tel:+2250700000000").catch(() => {});
	};

	const handleEmailSupport = () => {
		Linking.openURL("mailto:support@mojaride.com").catch(() => {});
	};

	return (
		<View className="flex-1 bg-white">
			<SubpageHeader title="Help & Support" />

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: 8,
					paddingBottom: BottomTabInset + insets.bottom + 24,
					gap: 16,
				}}
			>
				{/* Contact Cards Strip */}
				<View className="flex-row gap-3">
					<Pressable
						onPress={handleCallSupport}
						className="flex-1 bg-white rounded-[18px] border border-slate-100 p-4 items-center gap-2 shadow-sm shadow-black/5 active:opacity-75"
					>
						<View className="w-11 h-11 rounded-full bg-pink-50 items-center justify-center">
							<HugeiconsIcon icon={CallIcon} size={22} color="#ee237c" />
						</View>
						<Text className="text-sm font-bold text-slate-900">Call Support</Text>
						<Text className="text-[11px] text-slate-500">+225 07 00 00 00</Text>
					</Pressable>

					<Pressable
						onPress={handleEmailSupport}
						className="flex-1 bg-white rounded-[18px] border border-slate-100 p-4 items-center gap-2 shadow-sm shadow-black/5 active:opacity-75"
					>
						<View className="w-11 h-11 rounded-full bg-blue-50 items-center justify-center">
							<HugeiconsIcon icon={Mail01Icon} size={22} color="#0081F1" />
						</View>
						<Text className="text-sm font-bold text-slate-900">Email Us</Text>
						<Text className="text-[11px] text-slate-500">support@mojaride.com</Text>
					</Pressable>
				</View>

				{/* FAQ Section */}
				<View className="bg-white rounded-[20px] border border-slate-100 p-4 gap-3 shadow-sm shadow-black/5">
					<View className="flex-row items-center gap-2">
						<HugeiconsIcon icon={HelpCircleIcon} size={20} color="#ee237c" />
						<Text className="text-[15px] font-bold text-slate-900">Frequently Asked Questions</Text>
					</View>

					<View className="h-[0.5px] bg-slate-100" />

					<View className="gap-2">
						{FAQS.map((faq) => {
							const isExpanded = expandedFaq === faq.id;
							return (
								<View
									key={faq.id}
									className={`rounded-2xl overflow-hidden ${isExpanded ? "bg-pink-50/40 border border-pink-200/50" : ""}`}
								>
									<Pressable
										onPress={() => toggleFaq(faq.id)}
										className="flex-row items-center justify-between py-3 px-3 active:opacity-70"
									>
										<Text className={`text-sm flex-1 pr-2 ${isExpanded ? "font-bold text-pink-600" : "font-medium text-slate-800"}`}>
											{faq.question}
										</Text>
										<HugeiconsIcon
											icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
											size={18}
											color={isExpanded ? "#ee237c" : "#94a3b8"}
										/>
									</Pressable>

									{isExpanded ? (
										<View className="px-3 pb-3.5">
											<Text className="text-sm text-slate-500 leading-[19px]">{faq.answer}</Text>
										</View>
									) : null}
								</View>
							);
						})}
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
