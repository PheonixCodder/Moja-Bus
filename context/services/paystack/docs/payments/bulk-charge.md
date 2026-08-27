# Bulk Charge

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

Build a recurring system for accepting payment from multiple customers.

After accepting the first payment for goods and services from your customer, you can save the authorization of the payment for returning customers. Authorizations allow you to build a custom recurring payment system with minimal intervention from the customer. As your customer base grows, so does the complexity of building a recurring payment system.

The [Bulk ChargeAPI](https://paystack.com/docs/api/bulk-charge) endpoints abstract these complexities, providing you with a simple interface to interact with.

## How it works

When you have multiple customers to charge at regular intervals, it’s recommended that you send a group of charges per request as opposed to initiating a request per charge. This is to avoid rate limiting, while ensuring you have a scalable system as your business grows.

The [Bulk ChargeAPI](https://paystack.com/docs/api/bulk-charge) endpoint works with batches (batch processing) and charge objects. A batch consists of a collection of charge objects with the following parameters:

| Parameter | Required? | Type | Description |
| --- | --- | --- | --- |
| `amount` | Yes | Integer | The amount to charge the customer. |
| `authorization` | Yes | String | The authorization code from a previously completed transaction. |
| `reference` | No | String | A unique identifier for the charge. |
| `attempt_partial_debit` | No | Boolean | A flag to indicate if you want us to try recouping lower amounts when the customer has insufficient funds. |
| `at_least` | No | Integer | This is used in addition with the `attempt_partial_debit parameter`. It’s used to set the amount we should retry if the actual amount fails. |
| `metadata` | No | Object | This is to hold custom data for post-payment processes. |

The charges in a batch are queued when received and processed at intervals. During processing, if a charge fails, we add the charge back to the queue for further retry.

The table below shows the metric you need to keep in mind when planning your batch:

| Metric | Value | Description |
| --- | --- | --- |
| Max batch size | 1000 | The total number of charges that can be accepted per request. |
| Retry limit | 5 | The number of times we try processing a charge before we mark as failed. |

## Integration checklist

The number of charges in a batch is dependent on your use case and scale, so when planning your batch, here’s a checklist to reference:

-   Ensure your batch size is within the batch limit.
-   Always pass a reference to track each charge easily. References help with idempotency such that if you need to retry a particular charge again, you don't risk the chance of double debiting. In addition, you can't use the same authorization in a batch without a reference. If you need to charge an authorization multiple times in a batch, pass a reference for each charge.
-   Pass the `attempt_partial_debit` parameter if your business has a high rate of payment default.
-   When building your retry logic, use [Gateway Responses](https://paystack.com/docs/payments/gateway-responses/) to interpret the `gateway_response_code` in the `data` object. For customer errors, you need to reach out to them to resolve the issue, while for processing errors, you can retry using the same reference.

## Create a bulk charge

With your batch and charge design is in place, you can make a `POST` request to the [Initiate Bulk ChargeAPI](https://paystack.com/docs/api/bulk-charge#create) endpoint, passing each charge object to the batch:

cURLNodePHP

Show Response

```
1#!/bin/sh2url="https://api.paystack.co/bulkcharge"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='[6  {7    "amount": 10000,8    "authorization": "AUTH_ncx8hews93",9    "reference": "my_reference_1"10  },11  {12    "amount": 15000,13    "authorization": "AUTH_200nvt70zo",14    "reference": "my_reference_2"15  },16  {17    "amount": 25000,18    "authorization": "AUTH_84bqxd3rkf",19    "reference": "my_reference_3"20  }21]'22
23curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charges have been queued",4  "data": {5    "batch_code": "BCH_ml3zk2hregr1inj",6    "reference": "bulkcharge-1713528671888-29smeabva5",7    "id": 191016934,8    "integration": 463433,9    "domain": "test",10    "status": "active",11    "total_charges": 3,12    "pending_charges": 3,13    "createdAt": "2024-04-19T12:11:11.000Z",14    "updatedAt": "2024-04-19T12:11:11.000Z"15  }16}
```

The `batch_code` in the `data` object of the response allows you track and manage the batch, hence, it’s recommended that you save it for later use. There are two other parameters that gives you more details about the batch:

1.  `total_charges`: This is the total number of charge objects available in the batch.
2.  `pending_charges`: This is the amount of charges left to be processed.

## Listen to notifications

As previously mentioned, charges are queued before being processed, so you need to [implement a webhook URL](https://paystack.com/docs/payments/webhooks/) to get the status of each charge in a batch. While you might have sent multiple charges per batch, we send a webhook event for each charge in the batch. For example, if your batch contains 100 charges and all were successfully processed, you would get 100 events.

-   JSON

```
1{2  "event": "charge.success",3  "data": {4    "id": 3725529423,5    "domain": "test",6    "status": "success",7    "reference": "my_reference_3",8    "amount": 25126,9    "message": null,10    "gateway_response": "Approved",11    "paid_at": "2024-04-19T12:12:15.000Z",12    "created_at": "2024-04-19T12:12:12.000Z",13    "channel": "card",14    "currency": "NGN",15    "ip_address": null,16    "metadata": {17      "custom_fields": [18        {19          "display_name": "Bulkcharge ID",20          "variable_name": "bulkcharge_id",21          "value": "191016934"22        },23        {24          "display_name": "Bulkcharge batch code",25          "variable_name": "bulkcharge_batch_code",26          "value": "BCH_ml3zk2hregr1inj"27        },28        {29          "display_name": "Charged via",30          "variable_name": "charged_via",31          "value": "Bulkcharge"32        }33      ]34    },35    "fees_breakdown": null,36    "log": null,37    "fees": 126,38    "fees_split": null,39    "authorization": {40      "authorization_code": "AUTH_84bqxd3rkf",41      "bin": "408408",42      "last4": "4081",43      "exp_month": "12",44      "exp_year": "2030",45      "channel": "card",46      "card_type": "visa ",47      "bank": "TEST BANK",48      "country_code": "NG",49      "brand": "visa",50      "reusable": true,51      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",52      "account_name": null,53      "receiver_bank_account_number": null,54      "receiver_bank": null55    },56    "customer": {57      "id": 112907911,58      "first_name": "Mizz",59      "last_name": "Kaneah",60      "email": "mizz@kaneah.com",61      "customer_code": "CUS_lht026y5q7p27o5",62      "phone": "245421361",63      "metadata": {},64      "risk_action": "default",65      "international_format_phone": "+245421361"66    },67    "plan": {},68    "subaccount": {},69    "split": {},70    "order_id": null,71    "paidAt": "2024-04-19T12:12:15.000Z",72    "requested_amount": 25000,73    "pos_transaction_data": null,74    "source": {75      "type": "api",76      "source": "merchant_api",77      "entry_point": "charge",78      "identifier": null79    }80  }81}
```

At the moment, we only send webhook events for a successful charge. However, for various reasons, there might be issues processing the charge, so we recommend calling the [Verify TransactionAPI](https://paystack.com/docs/api/transaction#verify) endpoint for charges that you didn’t get an event for.

###### On this Page

-   [How it works](https://paystack.com/docs/payments/bulk-charge/#how-it-works)
-   [Integration checklist](https://paystack.com/docs/payments/bulk-charge/#integration-checklist)
-   [Create a bulk charge](https://paystack.com/docs/payments/bulk-charge/#create-a-bulk-charge)
-   [Listen to notifications](https://paystack.com/docs/payments/bulk-charge/#listen-to-notifications)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)