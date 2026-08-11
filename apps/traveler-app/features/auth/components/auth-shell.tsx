import type { ReactNode } from "react";
import {
	Image,
	type ImageSourcePropType,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthShellProps = {
	badge?: string;
	title: string;
	description: string;
	children: ReactNode;
	footer?: ReactNode;
	logoSource?: ImageSourcePropType;
};

export function AuthShell({
	badge,
	title,
	description,
	children,
	footer,
	logoSource,
}: AuthShellProps) {
	return (
		<View className="flex-1 bg-background">
			<View className="bg-[rgba(238,35,124,0.12)] absolute -top-[120px] -left-[120px] size-[260px] rounded-full" />
			<View className="bg-[rgba(238,35,124,0.08)] absolute -top-[100px] -right-[100px] size-[240px] rounded-full" />

			<SafeAreaView className="flex-1">
				<ScrollView
					contentContainerClassName="grow justify-around px-6 py-1"
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<View className="w-full max-w-[420px] gap-8 self-center">
						{logoSource ? (
							<View className="mb-4 items-center">
								<Image
									source={logoSource}
									className="h-[62px] w-[170px]"
									resizeMode="contain"
								/>
							</View>
						) : (
							<View className="mb-4 flex-row items-center gap-2">
								<View className="size-[10px] rounded-full bg-primary" />
								<Text className="text-[18px] font-bold tracking-tight text-foreground">
									Moja Ride
								</Text>
							</View>
						)}

						{badge ? (
							<View className="self-start rounded-full border border-border bg-secondary px-4 py-2">
								<Text className="text-[12px] font-bold uppercase tracking-[2.5px] text-primary">
									{badge}
								</Text>
							</View>
						) : null}

						<View className="max-w-[520px] gap-3">
							<Text className="text-[36px] font-bold leading-[42px] tracking-tight text-foreground">
								{title}
							</Text>
							<Text className="text-[16px] leading-[24px] text-muted-foreground">
								{description}
							</Text>
						</View>

						{children}

						{footer ? <View className="pt-1">{footer}</View> : null}
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}
