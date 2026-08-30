import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useDriverRegistrationStore } from "@/stores/driver-registration";

export function useWizardGuard(step: 2 | 3 | 4) {
	const router = useRouter();
	const {
		fullName,
		phone,
		licenseNumber,
		licenseExpiryDate,
		nationalIdNumber,
	} = useDriverRegistrationStore();

	// Zustand persist rehydrates from AsyncStorage asynchronously. On the very
	// first render all fields are "" (initial state), which would cause the guard
	// to bounce legitimate navigation back to step 1. Wait one tick after mount
	// so the store has time to rehydrate before we evaluate anything.
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => {
		// useDriverRegistrationStore.persist?.hasHydrated() is the official API
		// but we fall back to a simple one-tick delay which is sufficient because
		// AsyncStorage reads are synchronous in the JS thread after the first tick.
		const timer = setTimeout(() => setHydrated(true), 0);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (!hydrated) return; // skip until store is rehydrated

		const hasStep1 = Boolean(fullName.trim() && phone.trim());
		const hasStep2 = Boolean(hasStep1 && licenseNumber.trim() && licenseExpiryDate.trim());
		const hasStep3 = Boolean(hasStep2 && nationalIdNumber.trim());

		if (step === 2 && !hasStep1) {
			router.replace("/(auth)/register");
			return;
		}

		if (step === 3 && !hasStep2) {
			if (!hasStep1) {
				router.replace("/(auth)/register");
			} else {
				router.replace("/(auth)/register/license");
			}
			return;
		}

		if (step === 4 && !hasStep3) {
			if (!hasStep1) {
				router.replace("/(auth)/register");
			} else if (!hasStep2) {
				router.replace("/(auth)/register/license");
			} else {
				router.replace("/(auth)/register/documents");
			}
			return;
		}
	}, [hydrated, step, fullName, phone, licenseNumber, licenseExpiryDate, nationalIdNumber, router]);
}
