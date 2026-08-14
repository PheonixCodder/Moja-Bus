export interface GridSeatCoords {
  row: number;
  col: number;
}

/**
 * Place seats into a 0-based display grid.
 * API / layout-builder / Prisma use 1-based row/col — same as web `buildSeatGrid`.
 */
export function buildSeatGrid<T extends GridSeatCoords>(
  seats: T[],
  rows: number,
  columns: number,
): (T | undefined)[][] {
  const grid: (T | undefined)[][] = Array.from({ length: rows }, () =>
    Array(columns).fill(undefined),
  );

  for (const seat of seats) {
    const r = seat.row - 1;
    const c = seat.col - 1;
    if (r >= 0 && r < rows && c >= 0 && c < columns) {
      grid[r]![c] = seat;
    }
  }

  return grid;
}

export function getColumnHeaders(columns: number): string[] {
  return Array.from({ length: columns }, (_, i) =>
    String.fromCharCode(65 + i),
  );
}

export function isPassengerSeat(seatType?: string): boolean {
  return (
    seatType === "PASSENGER_WINDOW" ||
    seatType === "PASSENGER_AISLE" ||
    seatType === "PASSENGER_MIDDLE" ||
    !seatType
  );
}
