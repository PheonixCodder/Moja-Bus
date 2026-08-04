import { useEffect, useRef, useState } from "react";

export function useHoldCountdown(holdExpiresAt: string) {
	const [remaining, setRemaining] = useState<string>("");
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!holdExpiresAt) return;

		function update() {
			const now = Date.now();
			const expiry = new Date(holdExpiresAt).getTime();
			const diff = expiry - now;

			if (diff <= 0) {
				setRemaining("Expired");
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
				return;
			}

			const minutes = Math.floor(diff / 60000);
			const seconds = Math.floor((diff % 60000) / 1000);
			setRemaining(`${minutes}:${String(seconds).padStart(2, "0")}`);
		}

		update();
		intervalRef.current = setInterval(update, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [holdExpiresAt]);

	return remaining;
}
