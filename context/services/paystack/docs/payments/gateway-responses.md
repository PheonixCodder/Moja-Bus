# Gateway Responses

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

Handle post-payment workflows with standard gateway responses and ISO response codes.

When a transaction is processed, Paystack returns `gateway_response_code` which can be used to decide what to do next. Card transactions also return `response_code`, which is the raw processor code.

| Field | Meaning | Channel |
| --- | --- | --- |
| `response_code` | This is a 2 or 3 digit ISO 8583 code returned from the transaction processor. | Card |
| `gateway_response_code` | This is a string-based classification of the response code. It provides additional information about the response. | All |

## Transaction model

These fields are returned in the transaction object in the following operation:

-   Verify Transaction
-   Fetch Transaction
-   List Transactions
-   Webhooks for `charge.success` and the other `charge.*` transaction events
-   The final Charge and Charge Authorization responses

##### Card responses

`response_code` is only returned for card transactions. Other channels return `gateway_response_code` only.

## Response values

Generally, response codes make use of a 2-digit ISO 8583 code, with an exception to Amex cards. The table below shows how response codes map to `gateway_response_code`. Any code not listed resolves to `unknown`.

##### Successful code

`approved` is the only success value. Any other value means the transaction did not succeed.

| Response code | Gateway\_response\_code |
| --- | --- |
| `00` | `approved` |
| `01` | `refer_to_card_issuer` |
| `02` | `refer_to_card_issuer_special` |
| `03` | `invalid_merchant` |
| `04` | `pickup_card` |
| `05` | `do_not_honor` |
| `06` | `processing_error` |
| `07` | `pickup_card_special` |
| `08` | `honour_with_identification` |
| `09` | `processing` |
| `10` | `partial_approval` |
| `11` | `vip_approval` |
| `12` | `invalid_transaction` |
| `13` | `invalid_amount` |
| `14` | `invalid_account_number` |
| `15` | `no_such_issuer` |
| `16` | `approved_update_track_3` |
| `17` | `customer_cancellation` |
| `18` | `customer_dispute` |
| `19` | `reenter_transaction` |
| `20` | `invalid_response` |
| `21` | `no_action_taken` |
| `22` | `suspected_malfunction` |
| `23` | `unacceptable_transaction_fee` |
| `24` | `file_update_not_supported` |
| `25` | `unable_to_locate_record` |
| `26` | `duplicate_file_update` |
| `27` | `file_update_field_edit_error` |
| `28` | `file_temporarily_unavailable` |
| `29` | `file_update_not_successful` |
| `30` | `format_error` |
| `31` | `bank_not_supported` |
| `32` | `completed_partially` |
| `33` | `expired_card` |
| `34` | `suspected_fraud` |
| `35` | `contact_acquirer` |
| `36` | `restricted_card` |
| `37` | `call_acquirer_security` |
| `38` | `pin_tries_exceeded` |
| `39` | `no_credit_account` |
| `40` | `function_not_supported` |
| `41` | `pickup_lost_card` |
| `42` | `no_universal_account` |
| `43` | `pickup_stolen_card` |
| `44` | `no_investment_account` |
| `45` | `account_closed` |
| `46` | `identification_required` |
| `47` | `identification_cross_check_required` |
| `51` | `insufficient_funds` |
| `52` | `no_checking_account` |
| `53` | `no_savings_account` |
| `54` | `expired_card` |
| `55` | `invalid_pin` |
| `56` | `no_card_record` |
| `57` | `transaction_not_permitted_cardholder` |
| `58` | `transaction_not_permitted_terminal` |
| `59` | `suspected_fraud` |
| `60` | `contact_acquirer` |
| `61` | `daily_limit_exceeded` |
| `62` | `restricted_card` |
| `63` | `security_violation` |
| `64` | `original_amount_incorrect` |
| `65` | `withdrawal_frequency_exceeded` |
| `66` | `call_acquirer_security` |
| `67` | `hard_capture` |
| `68` | `response_received_too_late` |
| `69` | `advice_received_too_late` |
| `75` | `pin_tries_exceeded` |
| `76` | `unable_to_locate_previous_message` |
| `77` | `previous_message_inconsistent` |
| `78` | `card_blocked_first_use` |
| `80` | `credit_issuer_unavailable` |
| `81` | `pin_cryptographic_error` |
| `82` | `cvv_verification_failed` |
| `83` | `unable_to_verify_pin` |
| `85` | `verification_no_decline` |
| `90` | `cutoff_in_progress` |
| `91` | `issuer_or_switch_inoperative` |
| `92` | `routing_destination_not_found` |
| `93` | `legal_violation` |
| `94` | `duplicate_transmission` |
| `95` | `reconcile_error` |
| `96` | `system_malfunction` |
| `97` | `transaction_timeout` |
| `9G` | `blocked_by_cardholder` |

## Amex cards

Unlike other card providers that make use of a 2-digit ISO 8583 code, Amex makes use of a 3-digt code as shown in the table below:

| Response code | Gateway response code |
| --- | --- |
| `000` | `approved` |
| `001` | `honour_with_identification` |
| `002` | `partial_approval` |
| `100` | `declined` |
| `101` | `expired_card` |
| `106` | `pin_tries_exceeded` |
| `109` | `invalid_merchant` |
| `110` | `invalid_amount` |
| `111` | `invalid_account_number` |
| `115` | `function_not_supported` |
| `117` | `invalid_pin` |
| `119` | `transaction_not_permitted_cardholder` |
| `122` | `invalid_cvv` |
| `125` | `invalid_from_date` |
| `130` | `identification_required` |
| `181` | `format_error` |
| `183` | `unsupported_currency` |
| `187` | `card_replaced` |
| `189` | `account_closed` |
| `200` | `pickup_card` |
| `911` | `transaction_timeout` |
| `912` | `bank_unavailable` |

###### On this Page

-   [Transaction model](https://paystack.com/docs/payments/gateway-responses/#transaction-model)
-   [Response values](https://paystack.com/docs/payments/gateway-responses/#response-values)
-   [Amex cards](https://paystack.com/docs/payments/gateway-responses/#amex-cards)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)