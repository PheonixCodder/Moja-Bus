import type { PassengerBookingSummary } from "@moja/types";
import { formatLocationLabel } from "@/lib/format-location-label";

export type ActiveTripCardData = {
	originName: string;
	destName: string;
	departureTime: Date;
	referenceCode: string;
	seatLabel: string;
	bookingReference: string;
};

export function mapBookingToActiveTripCard(
	booking: PassengerBookingSummary,
): ActiveTripCardData {
	const isUrban = booking.serviceType === "URBAN";
	const originName = formatLocationLabel({
		cityName: booking.originCityName,
		municipalityName: booking.originMunicipalityName,
		quarterName: booking.originQuarterName,
		isUrban,
	});
	const destName = formatLocationLabel({
		cityName: booking.destinationCityName,
		municipalityName: booking.destinationMunicipalityName,
		quarterName: booking.destinationQuarterName,
		isUrban,
	});
	const firstSeat = booking.seats?.[0];

	return {
		originName,
		destName,
		departureTime: booking.departureTime,
		referenceCode: firstSeat?.bookingReference ?? booking.groupId,
		seatLabel: firstSeat?.seatLabel ?? "—",
		bookingReference: firstSeat?.bookingReference ?? booking.groupId,
	};
}
