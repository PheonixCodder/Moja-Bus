export interface GridSeat<T> {
  row: number;
  col: number;
  item: T;
}

export function buildSeatGrid<T extends { row: number; col: number }>(
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
