# Refunds

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

You can repay your customer for a previous transaction in part or fully by initiating a refund and listening to notifications.

## Getting started

Sometimes, a customer makes a request for their money after a successful transaction. Other times, an order can't be fulfilled after payment has been made. In either case, you need to consider if you should initiate a:

1.  Partial refund or,
2.  Full refund

Our [RefundAPI](https://paystack.com/docs/api/refund) endpoints allow you to repay your customers in part or fully. You simply initiate a refund request and we keep you updated on the status of the refund.

## Create a refund

To initiate a refund, you make a `POST` request to the [Create RefundAPI](https://paystack.com/docs/api/refund#create) and pass the transaction ID or reference in the `transaction` field. If an amount isn't passed, we handle the request as a full refund.

If you want to do a partial refund, you pass an `amount` parameter with the amount to refund. The refund amount must not be more than the original transaction amount.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/refund2-H 'authorization: Bearer YOUR_SECRET_KEY'3-H 'cache-control: no-cache'4-H 'content-type: application/json'5-d '{ "transaction":"qufywna9w9a5d8v", "amount":"10000" }'6-X POST
```

```
1{2  "status": true,3  "message": "Refund has been queued for processing",4  "data": {5    "transaction": {6      "id": 1004723697,7      "domain": "live",8      "reference": "T685312322670591",9      "amount": 10000,10      "paid_at": "2021-08-20T18:34:11.000Z",11      "channel": "apple_pay",12      "currency": "NGN",13      "authorization": {14        "exp_month": null,15        "exp_year": null,16        "account_name": null17      },18      "customer": {19        "international_format_phone": null20      },21      "plan": {},22      "subaccount": {23        "currency": null24      },25      "split": {},26      "order_id": null,27      "paidAt": "2021-08-20T18:34:11.000Z",28      "pos_transaction_data": null,29      "source": null,30      "fees_breakdown": null31    },32    "integration": 412829,33    "deducted_amount": 0,34    "channel": null,35    "merchant_note": "Refund for transaction T685312322670591 by test@me.com",36    "customer_note": "Refund for transaction T685312322670591",37    "status": "pending",38    "refunded_by": "test@me.com",39    "expected_at": "2021-12-16T09:21:17.016Z",40    "currency": "NGN",41    "domain": "live",42    "amount": 10000,43    "fully_deducted": false,44    "id": 3018284,45    "createdAt": "2021-12-07T09:21:17.122Z",46    "updatedAt": "2021-12-07T09:21:17.122Z"47  }48}
```

##### Maximum refund amount

The refund amount must not be more than the original transaction amount.

## Retry a refund

When you initiate a refund, it's typically processed with the bank account details of the customer returned from the processing rails on a successful payment. In cases where the customer's bank account wasn't returned, the refund status becomes `needs-attention`. This basically means you need to provide the customer's bank account details to continue processing the refund. You can do this by calling the [Retry RefundAPI](https://paystack.com/docs/api/refund#retry) endpoint:

cURLNodePHP

Show Response

```
1#!/bin/sh2url="https://api.paystack.co/refund/retry_with_customer_details/{id}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{6  "refund_account_details": {7    "currency": "NGN",8    "account_number": "1234567890",9    "bank_id": "9"10  }11}'12
13curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Refund retried and has been queued for processing",4  "data": {5    "integration": 123456,6    "transaction": 3298598423,7    "dispute": null,8    "settlement": null,9    "id": 1234567,10    "domain": "live",11    "currency": "NGN",12    "amount": 20000,13    "status": "processing",14    "refunded_at": null,15    "expected_at": "2025-10-13T16:02:18.000Z",16    "channel": "isw_3ds",17    "refunded_by": "paystack@email.com",18    "customer_note": "Refund for transaction T708775813895475",19    "merchant_note": "Refund for transaction T708775813895475 by paystack@email.com",20    "deducted_amount": 20000,21    "fully_deducted": true,22    "bank_reference": null,23    "reason": "PROCESSING",24    "customer": null,25    "initiated_by": "paystack@email.com",26    "reversed_at": null,27    "session_id": null28  }29}
```

The account details can be any valid bank account belonging to the customer and it can be different from the one used to make the initial payment.

##### Endpoint usage

Use this endpoint only when you receive a `refund.needs-attention` webhook event. Otherwise, the endpoint returns a **422 - unprocessable entity** response.

## List refunds

To pull a list of your refunds, you can use the [List RefundsAPI](https://paystack.com/docs/api/refund#list) to fetch all your refunds.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/refund 2-H 'authorization: Bearer YOUR_SECRET_KEY'3-H 'cache-control: no-cache'4-H 'content-type: application/json' 5-X GET
```

```
1{2  "status": true,3  "message": "Refunds retrieved",4  "data": [5    {6      "integration": 428626,7      "transaction": 627178582,8      "dispute": null,9      "settlement": null,10      "id": 747680,11      "domain": "test",12      "currency": "NGN",13      "amount": 10000,14      "status": "processed",15      "refunded_at": null,16      "refunded_by": "jen@smith.com",17      "customer_note": "Refund for transaction qufywna9w9a5d8v",18      "merchant_note": "Refund for transaction qufywna9w9a5d8v by jen@smith.com",19      "deducted_amount": 10000,20      "fully_deducted": true,21      "createdAt": "2020-05-19T11:12:17.000Z"22    },23    {24      "integration": 428626,25      "transaction": 640672957,26      "dispute": null,27      "settlement": null,28      "id": 742609,29      "domain": "test",30      "currency": "NGN",31      "amount": 20000,32      "status": "processed",33      "refunded_at": null,34      "refunded_by": "jen@smith.com",35      "customer_note": "blah blah",36      "merchant_note": "yada yada",37      "deducted_amount": 20000,38      "fully_deducted": true,39      "createdAt": "2020-04-30T10:43:47.000Z"40    }41  ],42  "meta": {43    "total": 2,44    "skipped": 0,45    "perPage": 50,46    "page": 1,47    "pageCount": 148  }49}
```

## Refund status

During the lifecycle of a refund, its status changes based on the actions performed by the refund processor. When the status of a refund changes, the status of the associated transaction follows suit.

The table below shows the relationship between the status of a refund and its associated transaction:

| Status | Description | Transaction Status |
| --- | --- | --- |
| `pending` | Refund initiated, waiting for response from the processor | Reversal Pending |
| `processing` | Refund has been received by the processor. | Reversal Pending |
| `needs-attention` | You need to provide the customer's bank details to proceed with the refund. | Reversal Pending |
| `failed` | The refund failed to process, and your account now reflects the credited amount. | Success |
| `processed` | Refund has successfully been processed by the processor. | Reversed |

##### Processed Refunds

When a refund is marked as `processed`, it may still take up to 10 business days for customers to receive their funds.

## Listen to notifications

##### Receiving Notifications

In order to receive notifications, you need to [implement a webhook URL](https://paystack.com/docs/payments/webhooks/) and set the webhook URL in your Paystack [dashboard](https://dashboard.paystack.com/#/settings/developer) or [canvas](https://dashboard.paystack.com/v2/developers).

We send different events based on the state of a refund. You can listen to the following events to stay updated on the state of a customer's refund:

| Event | Description |
| --- | --- |
| `refund.pending` | This is sent when a refund is initiated and we're waiting for a response from the processor. |
| `refund.processing` | This is sent when the refund has been received by the processor. |
| `refund.needs-attention` | This is sent when we need an account number to complete a refund. |
| `refund.failed` | This is sent when a refund can't be processed. Your account is credited with the refund amount. |
| `refund.processed` | This is sent when the refund has been successfully processed by the processor. |

-   Refund Pending
-   Refund Processing
-   Refund Needs Attention
-   Refund Processed
-   Refund Failed

```
1{2  "event": "refund.pending",3  "data": {4    "status": "pending",5    "transaction_reference": "tvunjbbd_412829_4b18075d_c7had",6    "refund_reference": null,7    "amount": "10000",8    "currency": "NGN",9    "processor": "instant-transfer",10    "customer": {11      "first_name": "Drew",12      "last_name": "Berry",13      "email": "demo@email.com"14    },15    "integration": 412829,16    "domain": "live"17  }18}
```

###### On this Page

-   [Getting started](https://paystack.com/docs/payments/refunds/#getting-started)
-   [Create a refund](https://paystack.com/docs/payments/refunds/#create-a-refund)
-   [Retry a refund](https://paystack.com/docs/payments/refunds/#retry-a-refund)
-   [List refunds](https://paystack.com/docs/payments/refunds/#list-refunds)
-   [Refund status](https://paystack.com/docs/payments/refunds/#refund-status)
-   [Listen to notifications](https://paystack.com/docs/payments/refunds/#listen-to-notifications)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)