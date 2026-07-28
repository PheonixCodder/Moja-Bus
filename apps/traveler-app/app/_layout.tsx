import "@/global.css";

import { PortalHost } from "@rn-primitives/portal";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useLoadFonts } from "@/hooks/use-load-fonts";
import { TRPCReactProvider } from "@/lib/trpc";

const LightTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		background: "#ffffff",
	},
};

export default function RootLayout() {
	const { fontsLoaded, fontsError } = useLoadFonts();

	if (!fontsLoaded && !fontsError) {
		return null;
	}

	return (
		<TRPCReactProvider>
			<ThemeProvider value={LightTheme}>
				<StatusBar style="dark" />
				<Stack screenOptions={{ headerShown: false }} />
				<PortalHost />
			</ThemeProvider>
		</TRPCReactProvider>
	);
}