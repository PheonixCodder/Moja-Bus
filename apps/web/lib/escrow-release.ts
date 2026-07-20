/**
 * Pure helpers for escrow release net calculation.
 * Fail closed (return null) when pricing snapshot is missing — never use gross fare.
 */

export type EscrowSnapshot = {
  operatorNetXOF: number;
  seatCount: number;
};

export function computeEscrowReleaseNet(input: {
  seatCountReleasing: number;
  cancelledCount: number;
  snapshot: EscrowSnapshot | null | undefined;
}): number | null {
  const { seatCountReleasing, cancelledCount, snapshot } = input;
  if (!snapshot || snapshot.seatCount <= 0 || seatCountReleasing <= 0) {
    return null;
  }
  const standardNet = Math.round(snapshot.operatorNetXOF / snapshot.seatCount);
  const isReleasingLastSeat =
    cancelledCount + seatCountReleasing === snapshot.seatCount;
  if (isReleasingLastSeat) {
    return Math.max(
      0,
      snapshot.operatorNetXOF - cancelledCount * standardNet,
    );
  }
  return seatCountReleasing * standardNet;
}
