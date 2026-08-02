export interface SegmentFare {
  fromStopOrder: number;
  toStopOrder: number;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  priceXOF: number;
}

/** Exact same predicate the main search pipeline uses (search-service.ts). */
export function matchSegmentFare(
  fares: SegmentFare[],
  fromStopOrder: number,
  toStopOrder: number,
  departureDate: Date,
): SegmentFare | null {
  return (
    fares.find(
      (f) =>
        f.fromStopOrder <= fromStopOrder &&
        f.toStopOrder >= toStopOrder &&
        f.isActive &&
        (!f.validFrom || departureDate.getTime() >= f.validFrom.getTime()) &&
        (!f.validUntil || departureDate.getTime() <= f.validUntil.getTime()),
    ) ?? null
  );
}
