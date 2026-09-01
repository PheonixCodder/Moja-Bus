import * as Haptics from "expo-haptics";

export const DriverFeedback = {
	successScan: async () => {
		try {
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch {}
	},
	invalidScan: async () => {
		try {
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		} catch {}
	},
	tap: async () => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		} catch {}
	},
	warning: async () => {
		try {
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		} catch {}
	},
	overspeedAlert: async () => {
		try {
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			setTimeout(async () => {
				try {
					await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
				} catch {}
			}, 120);
		} catch {}
	},
};
