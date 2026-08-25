import {
	Montserrat_400Regular,
	Montserrat_500Medium,
	Montserrat_600SemiBold,
	Montserrat_700Bold,
	Montserrat_900Black,
} from "@expo-google-fonts/montserrat";
import { useFonts } from "expo-font";

export function useLoadFonts() {
	const [loaded, error] = useFonts({
		Montserrat: Montserrat_400Regular,
		"Montserrat-Medium": Montserrat_500Medium,
		"Montserrat-SemiBold": Montserrat_600SemiBold,
		"Montserrat-Bold": Montserrat_700Bold,
		"Montserrat-Black": Montserrat_900Black,
	});
	return { fontsLoaded: loaded, fontsError: error };
}
