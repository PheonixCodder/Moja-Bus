import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";

export default function IndexScreen() {
	const router = useRouter();
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		async function checkAuth() {
			try {
				const session = await authClient.getSession();
				if (session?.data?.user) {
					router.replace("/(tabs)/trips");
				} else {
					router.replace("/(auth)/login");
				}
			} catch {
				router.replace("/(auth)/login");
			} finally {
				setIsChecking(false);
			}
		}
		checkAuth();
	}, [router]);

	return (
		<View className="flex-1 items-center justify-center bg-zinc-950">
			<ActivityIndicator size="large" color="#e11d48" />
		</View>
	);
}
