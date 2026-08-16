/**
 * Max concurrent seat load on a path (P1-3).
 * For each consecutive stop interval [k, k+1) between origin and dest,
 * count distinct seatIds with an active booking overlapping that interval.
 * Occupancy for remaining seats = this max (not raw booking row count).
 */
export type PathBookingSeat = {
  seatId: string;
  boardingStopOrder: number;
  dropoffStopOrder: number;
};

export function maxPathOccupancy(
  bookings: PathBookingSeat[],
  originOrder: number,
  destOrder: number,
): number {
  if (destOrder <= originOrder) return 0;
  let max = 0;
  for (let k = originOrder; k < destOrder; k++) {
    const seats = new Set<string>();
    for (const b of bookings) {
      // Interval k→k+1 overlaps booking iff boarding < k+1 && dropoff > k
      if (b.boardingStopOrder < k + 1 && b.dropoffStopOrder > k) {
        seats.add(b.seatId);
      }
    }
    if (seats.size > max) max = seats.size;
  }
  return max;
}
