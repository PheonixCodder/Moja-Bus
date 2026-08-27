# Test Payments

You can use the following test details to test different payment channels.

## Cards

##### Card expiry date

The expiry date for each card can be any date in the future.

### Successful cards

No validation(reusable)

4084 0840 8408 4081

Expiry07/27

CVV408

PIN validation

5078 5078 5078 5078 12

Expiry07/27

CVV081

Pin1111

PIN + OTP validation

5060 6666 6666 6666 666

Expiry07/27

CVV123

Pin1234

OTP123456

PIN + Phone + OTP validation

5078 5078 5078 5078 04

Expiry07/27

CVV884

Pin0000

OTP123456

Bank Auth Simulation(reusable)

5192 6027 2058 4796

Expiry07/27

CVV123

### Failed cards

Declined

4084 0800 0000 5408

Expiry07/27

CVV001

Token Not Generated

5078 5078 5078 5078 53

Expiry07/27

CVV082

Pin0000

### Refunds

To test for certain refunds scenario, you can use these cards when completing a transaction. The transaction will be successful but the card used determines the response of a refund request.

Failed

4084 0800 0067 1803

Expiry07/27

CVV180

Needs attention

4084 0800 0067 1902

Expiry07/27

CVV190

### API errors

Insufficent funds

4084 0800 0067 0037

Expiry07/27

CVV787

## EFT

##### Account usage

These accounts are supposed to be used to test for certain refunds scenario. However, since the accounts will always cause the transaction to be successful, you can also use them to test for successful transactions. The title on the cards show what the refund status will be when you initiate a refund on the transaction.

Failed

101 220 493 6

Needs attention

101 220 493 5

## Bank accounts

##### Nigerian merchants

Nigerian merchants can use a regular bank account to create a transfer recipient when testing in test mode.

Zenith Bank(transaction)

000 000 000 0

Birthday2007-07-04

OTP123456

Zenith Bank(transfer)

000 000 000 0

Code057

Kuda Bank

+234 810 000 000 0

Code50211

Token123456

## Mobile money

No PIN/OTP

055 123 498 7

NetworkMTN

No PIN/OTP

+254 710 000 000

NetworkM-Pesa

CIV - Orange

070 000 000 0

NetworkOrange

OTP1234

## Dedicated virtual account

You can make use of the [sample bank application](https://demobank.paystackintegrations.com/) we created to initiate a transfer to your test virtual account. If you simply want to try out the [dedicated virtual account](https://paystack.com/docs/payments/dedicated-virtual-accounts/) product, make use of the test account below:

Demo Bank

123 000 164 4

Pin0000

###### On this Page

-   [Cards](https://paystack.com/docs/payments/test-payments/#cards)
-   [EFT](https://paystack.com/docs/payments/test-payments/#eft)
-   [Bank accounts](https://paystack.com/docs/payments/test-payments/#bank-accounts)
-   [Mobile money](https://paystack.com/docs/payments/test-payments/#mobile-money)
-   [Dedicated virtual account](https://paystack.com/docs/payments/test-payments/#dedicated-virtual-account)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)