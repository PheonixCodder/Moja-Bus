# Partial Debits

Increase your revenue by recovering funds that would have otherwise been lost

## Introduction

With this feature, when an attempt to charge a card fails with insufficient funds, we will automatically retry with the maximum amount that can be charged. For example, if you attempt to charge someone NGN 10,000 but they only have NGN 4,000 in their account, historically, the transaction will fail with `insufficient funds`, but with partial debits, we will charge about NGN 3,900,

##### Allowed Cards

Partial debit is only available for `Mastercard` and `Verve` at the moment

## Who can use this?

This feature is only available on request. You will gain access once our reviews team approves it. Please reach out to `hello@paystack.com` to request access.

## How does it work?

You can only charge existing authorizations with this feature. There are 2 ways to use it. Either through the [Partial DebitAPI](https://paystack.com/docs/api/transaction#partial-debit) endpoint or our [Bulk ChargeAPI](https://paystack.com/docs/api/bulk-charge#initiate) endpoint.

##### Using the Bulk Charge endpoint

When using the bulk charge endpoint you need to pass the flag `"attempt_partial_debit" : true`

## Verifying transactions

When verifying transactions (or implementing webhooks) that involve Partial Debits, there are two types of amounts that are returned:

| Param | Description |
| --- | --- |
| amount | This is the amount, in the subunit of the [supported currency](https://paystack.com/api#supported-currency), that the customer was charged |
| `requested_amount` | This is the amount, [supported currency](https://paystack.com/api#supported-currency), you intended to charge. |

###### On this Page

-   [Introduction](https://paystack.com/docs/payments/partial-debits/#introduction)
-   [Who can use this?](https://paystack.com/docs/payments/partial-debits/#who-can-use-this)
-   [How does it work?](https://paystack.com/docs/payments/partial-debits/#how-does-it-work)
-   [Verifying transactions](https://paystack.com/docs/payments/partial-debits/#verifying-transactions)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)