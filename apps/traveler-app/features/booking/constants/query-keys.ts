import type { BookingFilterType } from "../hooks/use-bookings";

export const BOOKINGS_LIST_LIMIT = 20;
export const TICKETS_LIST_LIMIT = 50;
export const HOME_UPCOMING_LIMIT = 1;

export function bookingsListInput(
	filter: BookingFilterType,
	limit: number = BOOKINGS_LIST_LIMIT,
	offset = 0,
) {
	return { filter, limit, offset } as const;
}
