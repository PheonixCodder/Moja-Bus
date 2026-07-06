# Verify Payments

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

The Verify Transaction API allows you confirm the status of a customer's transaction.

## Transaction statuses

Webhooks are the preferred option for confirming a transaction status, but we currently send webhook events for just successful transactions. However, a transaction can have the following statuses:

| Status | Meaning |
| --- | --- |
| `abandoned` | The customer hasn't completed the transaction. |
| `failed` | The transaction failed. For more information on why, refer to the message/gateway response. |
| `ongoing` | The customer is currently trying to carry out an action to complete the transaction. This can get returned when we're waiting on the customer to enter an otp or to make a transfer (for a pay with transfer transaction). |
| `pending` | The transaction is currently in progress. |
| `processing` | Same as `pending`, but for direct debit transactions. |
| `queued` | The transaction has been queued to be processed later. Only possible on bulk charge transactions. |
| `reversed` | The transaction was reversed. This could mean the transaction was refunded, or a chargeback was successfully logged for this transaction. |
| `success` | The transaction was successfully processed. |

## Verify a transaction

You do this by making a `GET` request to the [Verify TransactionAPI](https://paystack.com/docs/api/transaction#verify) endpoint from your server using your transaction reference. This is dependent on the method you used to initialize the transaction.

### From Popup or mobile SDKs

You'll have to send the reference to your server, then from your server you call the verify endpoint.

### From the Redirect API

You initiate this request from your callback URL. The transaction reference is returned as a query parameter to your callback URL.

##### Helpful Tip

If you offer digital value like airtime, wallet top-up, digital credit, etc, always confirm that you haven't already delivered value for that transaction to avoid double fulfillments, especially, if you also use webhooks.

Here's a code sample for verifying transactions:

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/transaction/verify/:reference3-H "Authorization: Bearer YOUR_SECRET_KEY"4-X GET
```

```
1{2  "status": true,3  "message": "Verification successful",4  "data": {5    "id": 4099260516,6    "domain": "test",7    "status": "success",8    "reference": "re4lyvq3s3",9    "receipt_number": null,10    "amount": 40333,11    "message": null,12    "gateway_response": "Successful",13    "paid_at": "2024-08-22T09:15:02.000Z",14    "created_at": "2024-08-22T09:14:24.000Z",15    "channel": "card",16    "currency": "NGN",17    "ip_address": "197.210.54.33",18    "metadata": "",19    "log": {20      "start_time": 1724318098,21      "time_spent": 4,22      "attempts": 1,23      "errors": 0,24      "success": true,25      "mobile": false,26      "input": [],27      "history": [28        {29          "type": "action",30          "message": "Attempted to pay with card",31          "time": 332        },33        {34          "type": "success",35          "message": "Successfully paid with card",36          "time": 437        }38      ]39    },40    "fees": 10283,41    "fees_split": null,42    "authorization": {43      "authorization_code": "AUTH_uh8bcl3zbn",44      "bin": "408408",45      "last4": "4081",46      "exp_month": "12",47      "exp_year": "2030",48      "channel": "card",49      "card_type": "visa ",50      "bank": "TEST BANK",51      "country_code": "NG",52      "brand": "visa",53      "reusable": true,54      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",55      "account_name": null56    },57    "customer": {58      "id": 181873746,59      "first_name": null,60      "last_name": null,61      "email": "demo@test.com",62      "customer_code": "CUS_1rkzaqsv4rrhqo6",63      "phone": null,64      "metadata": null,65      "risk_action": "default",66      "international_format_phone": null67    },68    "plan": null,69    "split": {},70    "order_id": null,71    "paidAt": "2024-08-22T09:15:02.000Z",72    "createdAt": "2024-08-22T09:14:24.000Z",73    "requested_amount": 30050,74    "pos_transaction_data": null,75    "source": null,76    "fees_breakdown": null,77    "connect": null,78    "transaction_date": "2024-08-22T09:14:24.000Z",79    "plan_object": {},80    "subaccount": {}81  }82}
```

##### Warning

The API response has a status key `response.status` indicating the status of the API call. This is **not** the status of the transaction. The status of the transaction is in the `data` object in the verify API response, i.e `response.data.status`. Learn more about [Paystack API format](https://paystack.com/docs/api).

The response also includes `gateway_response_code`. Check out the [Gateway Responses](https://paystack.com/docs/payments/gateway-responses/) for the full list of values and how they map to response codes.

## Charge returning users

The `verify` response also returns information about the payment instrument that the user paid with in the `data.authorization` object. If the channel is `card`, then you can store the `authorization_code` for that card against that user and use that charge the user for subsequent transaction. Learn more about [recurring charges](https://paystack.com/docs/payments/recurring-charges/).

###### On this Page

-   [Transaction statuses](https://paystack.com/docs/payments/verify-payments/#transaction-statuses)
-   [Verify a transaction](https://paystack.com/docs/payments/verify-payments/#verify-a-transaction)
-   [Charge returning users](https://paystack.com/docs/payments/verify-payments/#charge-returning-users)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)