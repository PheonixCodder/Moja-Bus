import { authOtpWorkflow } from "./auth/auth-otp";
import { operatorSignupOtpWorkflow } from "./auth/operator-signup-otp";
import { operatorWelcomeWorkflow } from "./auth/operator-welcome";

import { operatorStaffInviteWorkflow } from "./staff/operator-staff-invite";
import { staffAcceptanceAlertWorkflow } from "./staff/staff-acceptance-alert";

import { passengerBookingConfirmedWorkflow } from "./payments/booking-confirmed";
import { passengerBookingRefundedWorkflow } from "./payments/booking-refunded";
import { passengerWalletTopupWorkflow } from "./payments/wallet-topup";
import { operatorWithdrawalRequestedWorkflow } from "./payments/withdrawal-requested";
import { operatorWithdrawalSettledWorkflow } from "./payments/withdrawal-settled";
import { operatorWithdrawalFailedWorkflow } from "./payments/withdrawal-failed";
import { operatorVerificationApprovedWorkflow } from "./payments/operator-verification-approved";
import { operatorVerificationRejectedWorkflow } from "./payments/operator-verification-rejected";

import { adminTreasuryNetworkFailureWorkflow } from "./admin/admin-treasury-network-failure";
import { adminOperatorSignupPendingWorkflow } from "./admin/operator-signup-pending";
import { adminBankAccountPendingWorkflow } from "./admin/bank-account-pending";
import { adminPayoutFailedWorkflow } from "./admin/payout-failed";
import { operatorBankVerifiedWorkflow } from "./admin/bank-verified";
import { operatorBankRejectedWorkflow } from "./admin/bank-rejected";
import { operatorAccountSuspendedWorkflow } from "./admin/account-suspended";
import { operatorAccountRestoredWorkflow } from "./admin/account-restored";
import { operatorWithdrawalResolvedWorkflow } from "./admin/withdrawal-resolved";
import { userRoleUpdatedWorkflow } from "./admin/user-role-updated";

import { passengerTripDelayedWorkflow } from "./operator/trip-delayed";
import { passengerTripCancelledWorkflow } from "./operator/trip-cancelled";
import { passengerTripBoardingWorkflow } from "./operator/trip-boarding";
import { passengerTripGateUpdatedWorkflow } from "./operator/trip-gate-updated";
import { operatorBusAssignedWorkflow } from "./operator/bus-assigned";
import { passengerReviewRequestWorkflow } from "./operator/review-request";

import { passengerHoldCreatedWorkflow } from "./passenger/hold-created";
import { passengerWalletLowBalanceWorkflow } from "./passenger/wallet-low-balance";
import { passengerReviewSubmittedWorkflow } from "./passenger/review-submitted";
import { passengerProfileUpdatedWorkflow } from "./passenger/profile-updated";
import { passengerTicketSharedWorkflow } from "./passenger/ticket-shared";

export const workflows = [
  authOtpWorkflow,
  operatorSignupOtpWorkflow,
  operatorWelcomeWorkflow,
  operatorStaffInviteWorkflow,
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
  adminBankAccountPendingWorkflow,
  adminPayoutFailedWorkflow,
  operatorBankVerifiedWorkflow,
  operatorBankRejectedWorkflow,
  operatorAccountSuspendedWorkflow,
  operatorAccountRestoredWorkflow,
  operatorWithdrawalResolvedWorkflow,
  userRoleUpdatedWorkflow,
  passengerTripDelayedWorkflow,
  passengerTripCancelledWorkflow,
  passengerTripBoardingWorkflow,
  passengerTripGateUpdatedWorkflow,
  operatorBusAssignedWorkflow,
  passengerReviewRequestWorkflow,
  passengerHoldCreatedWorkflow,
  passengerWalletLowBalanceWorkflow,
  passengerReviewSubmittedWorkflow,
  passengerProfileUpdatedWorkflow,
  passengerTicketSharedWorkflow,
];



