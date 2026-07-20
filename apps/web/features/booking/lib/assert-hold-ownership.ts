import { TRPCError } from "@trpc/server";

type HoldLike = {
  id: string;
  userId: string | null;
};

/**
 * Ensures the authenticated passenger owns the hold group.
 */
export function assertHoldOwnedByUser(hold: HoldLike, userId: string): void {
  if (hold.userId === userId) {
    return;
  }
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have permission to act on this hold",
  });
}
