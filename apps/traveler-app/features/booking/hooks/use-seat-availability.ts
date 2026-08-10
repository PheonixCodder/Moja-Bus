import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';

export function useSeatAvailability(offerId: string) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.booking.getSeatAvailability.queryOptions({ offerId }),
    enabled: !!offerId,
  });
}
