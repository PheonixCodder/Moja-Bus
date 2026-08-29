import { useEffect } from "react";
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

	useEffect(() => {
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
	}, [step, fullName, phone, licenseNumber, licenseExpiryDate, nationalIdNumber, router]);
}
