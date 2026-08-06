-- Add APPROVED terminal state to LocationCaptureStatus so an approved capture
-- leaves the terminals.list live-captures filter (status IN OPEN/PENDING_CONFIRMATION/CONFIRMED).
ALTER TYPE "LocationCaptureStatus" ADD VALUE 'APPROVED';
