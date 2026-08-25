import { operatorAccountRestoredWorkflow } from "./admin/account-restored";
import { operatorAccountSuspendedWorkflow } from "./admin/account-suspended";
import { adminTreasuryNetworkFailureWorkflow } from "./admin/admin-treasury-network-failure";
// Phase 22 (F-NF-08 ruling: DELETED) — admin-bank-account-pending workflow
// REMOVED entirely (file deleted): bank saves are Paystack-self-verifying
// (isVerified:true at save), so no honest "pending" event can ever occur;
// firing it would be a false notice. Full ruling in phase-22 file.
import { operatorBankRejectedWorkflow } from "./admin/bank-rejected";
import { operatorBankVerifiedWorkflow } from "./admin/bank-verified";
import { adminOperatorSignupPendingWorkflow } from "./admin/operator-signup-pending";
import { adminPayoutFailedWorkflow } from "./admin/payout-failed";
import { userRoleUpdatedWorkflow } from "./admin/user-role-updated";
import { operatorWithdrawalResolvedWorkflow } from "./admin/withdrawal-resolved";
import { authOtpWorkflow } from "./auth/auth-otp";
import { operatorSignupOtpWorkflow } from "./auth/operator-signup-otp";
import { operatorWelcomeWorkflow } from "./auth/operator-welcome";
import {
  driverDispatchUrgentWorkflow,
  driverTripAssignedWorkflow,
  driverTripUnassignedWorkflow,
} from "./driver/dispatch";
// Phase 11 — Driver employment offer board
import {
  driverOfferCounterAcceptedWorkflow,
  driverOfferCounterDeclinedWorkflow,
  driverOfferCounteredWorkflow,
  driverOfferExpiredWorkflow,
  driverOfferExpiringSoonWorkflow,
  driverOfferReceivedWorkflow,
  driverOfferWithdrawnWorkflow,
} from "./driver/driver-offers";
import { driverLicenseStatusWorkflow } from "./driver/license-status";
import {
  driverMarketplaceFeaturedWorkflow,
  driverMarketplaceSuspendedWorkflow,
} from "./driver/marketplace-status";
import {
  driverAffiliationEndedWorkflow,
  operatorOfferAcceptedWorkflow,
  operatorOfferCounteredWorkflow,
  operatorOfferDeclinedWorkflow,
  operatorOfferExpiredWorkflow,
  operatorOfferExpiringSoonWorkflow,
} from "./driver/operator-offers";
import { driverRosterRemovedWorkflow } from "./driver/roster-removed";
import { driverVerificationOutcomeWorkflow } from "./driver/verification-outcome";
import { operatorBusAssignedWorkflow } from "./operator/bus-assigned";
import { operatorDriverAssignmentConflictWorkflow } from "./operator/driver-conflict";
import {
  campaignBudgetExhaustedWorkflow,
  operatorCampaignPausedWorkflow,
} from "./operator/promo-campaigns";
import { passengerReviewRequestWorkflow } from "./operator/review-request";
import { passengerTripBoardingWorkflow } from "./operator/trip-boarding";
import { passengerTripCancelledWorkflow } from "./operator/trip-cancelled";

import { passengerRebookedWorkflow } from "./passenger/rebooked";
import { passengerTripDelayedWorkflow } from "./operator/trip-delayed";
import { passengerTripGateUpdatedWorkflow } from "./operator/trip-gate-updated";
import { passengerCampaignStartingWorkflow } from "./passenger/campaign-starting";
import { passengerHoldCreatedWorkflow } from "./passenger/hold-created";
import { passengerProfileUpdatedWorkflow } from "./passenger/profile-updated";
import {
  passengerCreditExpiringWorkflow,
  passengerReferralAttributedWorkflow,
  passengerReferralRewardWorkflow,
} from "./passenger/promo-incentives";
import { passengerReviewSubmittedWorkflow } from "./passenger/review-submitted";
import { passengerTicketSharedWorkflow } from "./passenger/ticket-shared";
import { passengerWalletLowBalanceWorkflow } from "./passenger/wallet-low-balance";
import { passengerBookingConfirmedWorkflow } from "./payments/booking-confirmed";
import { passengerBookingRefundedWorkflow } from "./payments/booking-refunded";
import { operatorVerificationApprovedWorkflow } from "./payments/operator-verification-approved";
import { operatorVerificationRejectedWorkflow } from "./payments/operator-verification-rejected";
import { passengerWalletTopupWorkflow } from "./payments/wallet-topup";
import { operatorWithdrawalFailedWorkflow } from "./payments/withdrawal-failed";
import { operatorWithdrawalRequestedWorkflow } from "./payments/withdrawal-requested";
import { operatorWithdrawalSettledWorkflow } from "./payments/withdrawal-settled";
import { adminStaffInviteWorkflow } from "./staff/admin-staff-invite";
import { operatorStaffInviteWorkflow } from "./staff/operator-staff-invite";
import { staffAcceptanceAlertWorkflow } from "./staff/staff-acceptance-alert";

export const workflows = [
  authOtpWorkflow,
  operatorSignupOtpWorkflow,
  operatorWelcomeWorkflow,
  operatorStaffInviteWorkflow,
  adminStaffInviteWorkflow,
  staffAcceptanceAlertWorkflow,
  passengerBookingConfirmedWorkflow,
  passengerBookingRefundedWorkflow,
  passengerWalletTopupWorkflow,
  operatorWithdrawalRequestedWorkflow,
  operatorWithdrawalSettledWorkflow,
  operatorWithdrawalFailedWorkflow,
  operatorVerificationApprovedWorkflow,
  operatorVerificationRejectedWorkflow,
  adminTreasuryNetworkFailureWorkflow,
  adminOperatorSignupPendingWorkflow,
  // Phase 22 (F-NF-08): adminBankAccountPendingWorkflow DELETED — see ruling
  // at the import block above.
  adminPayoutFailedWorkflow,
  operatorBankVerifiedWorkflow,
  operatorBankRejectedWorkflow,
  operatorAccountSuspendedWorkflow,
  operatorAccountRestoredWorkflow,
  operatorWithdrawalResolvedWorkflow,
  userRoleUpdatedWorkflow,
  passengerTripDelayedWorkflow,
  passengerTripCancelledWorkflow,
  passengerRebookedWorkflow,
  passengerTripBoardingWorkflow,
  passengerTripGateUpdatedWorkflow,
  operatorBusAssignedWorkflow,
  passengerReviewRequestWorkflow,
  operatorDriverAssignmentConflictWorkflow,
  passengerHoldCreatedWorkflow,
  passengerWalletLowBalanceWorkflow,
  passengerReviewSubmittedWorkflow,
  passengerProfileUpdatedWorkflow,
  passengerTicketSharedWorkflow,
  passengerReferralAttributedWorkflow,
  passengerReferralRewardWorkflow,
  passengerCreditExpiringWorkflow,
  passengerCampaignStartingWorkflow,
  operatorCampaignPausedWorkflow,
  campaignBudgetExhaustedWorkflow,

  // Phase 11 — Driver employment offer board
  driverOfferReceivedWorkflow,
  driverOfferCounteredWorkflow,
  driverOfferCounterAcceptedWorkflow,
  driverOfferCounterDeclinedWorkflow,
  driverOfferWithdrawnWorkflow,
  driverOfferExpiringSoonWorkflow,
  driverOfferExpiredWorkflow,
  operatorOfferCounteredWorkflow,
  operatorOfferAcceptedWorkflow,
  operatorOfferDeclinedWorkflow,
  operatorOfferExpiringSoonWorkflow,
  operatorOfferExpiredWorkflow,
  driverAffiliationEndedWorkflow,

  // Phase 13 (F-OP-02) — operator-initiated roster removal notice
  driverRosterRemovedWorkflow,

  // Phase 14 (F-OP-03/F-DV-12) — licence expiry warning + flip notices
  driverLicenseStatusWorkflow,

  // Phase 25 (F-OP-09) — platform verification outcome notices
  driverVerificationOutcomeWorkflow,

  // Phase 12 — Dispatch board assignments
  driverTripAssignedWorkflow,
  driverDispatchUrgentWorkflow,
  driverTripUnassignedWorkflow,
  driverMarketplaceFeaturedWorkflow,
  driverMarketplaceSuspendedWorkflow,
];
