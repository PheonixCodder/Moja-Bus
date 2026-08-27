# Direct Debit

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

A business can initiate a debit authorization request on a customer’s account. Once the customer gives consent, their account can be debited by that business on a recurring basis.

Direct debit is a payment channel that allows a business to debit a customer’s bank account once the customer has given consent. Before a customer’s account can be debited, they need to give consent to the business they’re liaising with. The business can create a mandate seeking the permission of their customer to debit their account.

There are two ways to set up a mandate authorization:

1.  Initialize a transaction
2.  Initiate an authorization request

##### Feature availability

This feature is available to businesses in Nigeria only.

## Initialize transaction

The fastest way to set up an authorization for a customer is to pass the `bank` channel with a custom filter to the [Initialize TransactionAPI](https://paystack.com/docs/api/transaction#initialize) endpoint:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transaction/initialize2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "10000", 6      "channels": ["bank"],7      "metadata": {8        "custom_filters": {9          "recurring": true10        }11      }12    }'13-X POST
```

```
1{2  "status": true,3  "message": "Authorization URL created",4  "data": {5    "authorization_url": "https://checkout.paystack.com/zcwh3axoir37x7q",6    "access_code": "zcwh3axoir37x7q",7    "reference": "gz8nyit2zd"8  }9}
```

During the process of completing the transaction, the customer’s consent is gotten giving us the permission to create a mandate that can be used for subsequent payments. A mandate is only created if the customer’s account is among the [supported banks](#supported-banks) for Direct Debit. You can follow the steps in the [verify authorization status](#verify-authorization-status) to get the authorization status.

## Initiate an authorization request

Alternatively, you can issue a mandate to a customer to debit their account by using the [Initialize AuthorizationAPI](https://paystack.com/docs/api/customer#initialize-authorization) endpoint:

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/customer/authorization/initialize3-H "Authorization: Bearer YOUR_SECRET_KEY"4-H "Content-Type: application/json"5-d '{ 6        "email": "ravi@demo.com",7        "channel": "direct_debit",8        "callback_url": "http://test.url.com"9    }'10-X POST
```

```
1{2  "status": true,3  "message": "Authorization initialized",4  "data": {5    "redirect_url": "https://link.paystack.co/82t4mp5b5mfn51h",6    "access_code": "82t4mp5b5mfn51h",7    "reference": "dfbzfotsrbv4n5s82t4mp5b5mfn51h"8  }9}
```

The response contains a `redirect_url` that you would redirect the customer to give consent to your request. If you provided a `callback_url` in your request, the customer will be sent to that page after giving consent.

For a better UI experience, you can pre-fill some of the customer’s information by adding the `account` and `address` objects in your request:

```bash
1curl https://api.paystack.co/customer/authorization/initialize2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{5      "channel": "direct_debit",6      "email": "ravi@demo.com",7      "callback_url": "http://test.url.com",8      "account": {9        "number": "0128034955",10        "bank_code": "058"11      },12      "address": {13        "state": "Lagos",14        "city": "Akoka",15        "street": "17 Beckley Avenue"16      }17    }'18-X POST
```

While both the `account` and `address` objects are optional, when used, all params in both objects are compulsory. The `bank_code` in the `account` object represent the customer’s bank.

## Supported banks

We currently support the banks listed below. We're actively working with our partners to support more banks and we'll keep you updated on new additions.

| Bank | Bank code |
| --- | --- |
| Access Bank | 044 |
| Citibank Nigeria | 023 |
| Ecobank Nigeria | 050 |
| Fidelity Bank | 070 |
| First Bank of Nigeria | 011 |
| First City Monument Bank | 214 |
| Globus Bank | 00103 |
| Guaranty Trust Bank | 058 |
| Heritage Bank | 030 |
| Jaiz Bank | 301 |
| Keystone Bank | 082 |
| Polaris Bank | 076 |
| PremiumTrust Bank | 105 |
| Providus Bank | 101 |
| Stanbic IBTC Bank | 221 |
| Standard Chartered Bank | 068 |
| Sterling Bank | 232 |
| Suntrust Bank | 100 |
| Titan Bank | 102 |
| Union Bank of Nigeria | 032 |
| United Bank For Africa | 033 |
| Unity Bank | 215 |
| Wema Bank | 035 |
| Zenith Bank | 057 |

We do a verification on the bank code before creating the authorization. If the bank code provided isn’t on the list of supported banks, we will return a `Bank not supported for direct debit` error.

## Verify authorization status

We send the following webhook events to your webhook URL to communicate the status of the customer's authorization:

| Event | Description |
| --- | --- |
| `direct_debit.authorization.created` | This is sent when the customer approves your authorization request. This doesn't mean that the customer's account is ready to be charged. |
| `direct_debit.authorization.active` | This is sent when the customer's authorization is active and their account can be charged. |

-   Authorization Created
-   Authorization Active

```
1{2  "event": "direct_debit.authorization.created",3  "status": true,4  "message": "Authorization retrieved successfully",5  "data": {6    "authorization_code": "AUTH_JV4T9Wawdj",7    "active": false,8    "last4": "1234",9    "channel": "direct_debit",10    "card_type": "mandate",11    "bank": "Guaranty Trust Bank",12    "exp_month": 1,13    "exp_year": 2034,14    "country_code": "NG",15    "brand": "Guaranty Trust Bank",16    "reusable": true,17    "signature": "SIG_u8SqR3E6ty2koQ9i5IrI",18    "account_name": "Ravi Demo",19    "customer": {20      "first_name": "Ravi",21      "last_name": "Demo",22      "code": "CUS_g0a2pm2ilthhh62",23      "email": "ravi@demo.com",24      "phone": "",25      "metadata": null,26      "risk_action": "default"27    }28  }29}
```

Alternatively, you can confirm the status of an authorization by making a request to the [Verify AuthorizationAPI](https://paystack.com/docs/api/customer#verify-authorization) with the reference from the initialization request.

##### Authorization activation

Mandate activation is dependent on the customer’s bank and can take **up to 24 hours (sometimes longer)**. If a mandate remains pending beyond that, you can try [triggering an activation charge](https://paystack.com/docs/payments/direct-debit/#retrying-a-pending-authorization) again, or reach out to [support@paystack.com](mailto:support@paystack.com).

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/customer/authorization/verify/:reference3-H "Authorization: Bearer YOUR_SECRET_KEY"4-X GET
```

```
1{2  "status": true,3  "message": "Authorization retrieved successfully",4  "data": {5    "authorization_code": "AUTH_JV4T9Wawdj",6    "channel": "direct_debit",7    "bank": "Guaranty Trust Bank",8    "active": true,9    "customer": {10      "code": "CUS_24lze1c8i2zl76y",11      "email": "ravi@demo.com"12    }13  }14}
```

If the authorization hasn't been approved or you try verifying before it’s creation, you’ll get a `404 error` with the response show below:

-   JSON

```
1{2  "status": false,3  "message": "Authorization does not exist or does not belong to integration",4  "metadata": {5    "nextStep": "Try again later"6  },7  "type": "api_error",8  "code": "unknown"9}
```

##### Rate limiting

When calling the Verify Authorization endpoint, you are subjected to our rate limiting rules.

## Retrying a pending authorization

There could be instances when an authorization is stuck in a `pending` status. In such cases you can trigger an activation charge for the customer:

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/customer/{id}/directdebit-activation-charge3-H "Authorization: Bearer YOUR_SECRET_KEY"4-H "Content-Type: application/json"5-d '{ 6        "authorization_id" : 10693099177    }'8-X PUT
```

```
1{2  "status": true,3  "message": "Mandate is queued for retry"4}
```

For multiple customers, you can use the [Direct Debit Activation ChargeAPI](https://paystack.com/docs/api/directdebit#activation-charge) endpoint as shown below:

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/directdebit/activation-charge3-H "Authorization: Bearer YOUR_SECRET_KEY"4-H "Content-Type: application/json"5-d '{ 6        "customer_ids": [28958104, 983697220]7    }'8-X PUT
```

```
1{2  "status": true,3  "message": "Mandate is queued for retry"4}
```

##### Customer's account validation

This request will cause a debit of **NGN 50** on the customer’s account for us to confirm if the customer’s account can be debited. However, this is refunded once we complete the check.

## Charge account

Once a customer approves an authorization, we provide an `authorization_code` that you can use to debit their account on a recurring basis. You can debit the customer’s account by passing the `authorization_code` with the matching `email` to the [charge authorizationAPI](https://paystack.com/docs/api/transaction#charge-authorization) endpoint.

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/transaction/charge_authorization3-H "Authorization: Bearer YOUR_SECRET_KEY"4-H "Content-Type: application/json"5-d '{ 6      "authorization_code" : "AUTH_JV4T9Wawdj", 7      "email": "ravi@demo.com", 8      "amount": "10000",9      "currency": "NGN"10    }'11-X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "amount": 10000,6    "currency": "NGN",7    "transaction_date": "2023-10-24T12:32:24.000Z",8    "status": "processing",9    "reference": "nl3eljdd6qgbrho",10    "domain": "live",11    "metadata": "",12    "gateway_response": "Transaction in progress",13    "message": null,14    "channel": "direct_debit",15    "ip_address": null,16    "log": null,17    "fees": null,18    "authorization": {19      "authorization_code": "AUTH_JV4T9Wawdj",20      "bin": null,21      "last4": null,22      "exp_month": null,23      "exp_year": null,24      "channel": "direct_debit",25      "card_type": null,26      "bank": "Guaranty Trust Bank",27      "country_code": "NG",28      "brand": null,29      "reusable": true,30      "signature": null,31      "account_name": null32    },33    "customer": {34      "id": 180061682,35      "first_name": "Ravi",36      "last_name": "Demo",37      "email": "ravi@demo.com",38      "customer_code": "CUS_24lze1c8i2zl76y",39      "phone": "",40      "metadata": null,41      "risk_action": "default",42      "international_format_phone": null43    },44    "plan": null,45    "id": 150423859646  }47}
```

By default, we return a status of `processing` while we conclude charging the customer account. You’d need the `data.reference` parameter to verify the status of the charge.

You can also use the authorization for subscriptions via the [Create SubscriptionAPI](https://paystack.com/docs/api/subscription/#create) endpoint. In cases where the customer has other authorizations, ensure you send the `authorization_code` that’s returned above, otherwise Paystack picks the most recent authorization. Checkout our [Subscription docs](https://paystack.com/docs/payments/subscriptions/) to learn more.

## Verify charge

To verify the status of a charge, you need to listen to the `charge.success` event on [your webhook URL](https://paystack.com/docs/payments/webhooks/):

-   JSON

```
1{2  "event": "charge.success",3  "data": {4    "id": 1504238596,5    "domain": "live",6    "status": "success",7    "reference": "nl3eljdd6qgbrho",8    "amount": 10000,9    "message": "madePayment",10    "gateway_response": "Payment successful",11    "paid_at": "2023-10-24T12:32:30.000Z",12    "created_at": "2023-10-24T12:32:24.000Z",13    "channel": "direct_debit",14    "currency": "NGN",15    "ip_address": null,16    "metadata": "",17    "fees_breakdown": null,18    "log": null,19    "fees": 0,20    "fees_split": null,21    "authorization": {22      "authorization_code": "AUTH_JV4T9Wawdj",23      "bin": null,24      "last4": null,25      "exp_month": null,26      "exp_year": null,27      "channel": "direct_debit",28      "card_type": null,29      "bank": "Guaranty Trust Bank",30      "country_code": "NG",31      "brand": null,32      "reusable": true,33      "signature": null,34      "account_name": null35    },36    "customer": {37      "id": 180061682,38      "first_name": "Ravi",39      "last_name": "Demo",40      "email": "ravi@demo.com",41      "customer_code": "CUS_24lze1c8i2zl76y",42      "phone": "",43      "metadata": null,44      "risk_action": "default",45      "international_format_phone": null46    },47    "plan": {},48    "subaccount": {},49    "split": {},50    "order_id": null,51    "paidAt": "2023-10-24T12:32:30.000Z",52    "requested_amount": 10000,53    "pos_transaction_data": null,54    "source": {55      "type": "api",56      "source": "merchant_api",57      "entry_point": "charge",58      "identifier": null59    }60  }61}
```

Alternatively, you can make a request to the [Verify TransactionAPI](https://paystack.com/docs/api/transaction#verify) endpoint using the `reference` from the response of your charge request.

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/transaction/verify/:reference3-H "Authorization: Bearer YOUR_SECRET_KEY"4-X GET
```

```
1{2  "status": true,3  "message": "Verification successful",4  "data": {5    "id": 1504238596,6    "domain": "live",7    "status": "success",8    "reference": "nl3eljdd6qgbrho",9    "receipt_number": null,10    "amount": 10000,11    "message": "madePayment",12    "gateway_response": "Payment successful",13    "paid_at": "2023-10-24T12:32:30.000Z",14    "created_at": "2023-10-24T12:32:24.000Z",15    "channel": "direct_debit",16    "currency": "NGN",17    "ip_address": null,18    "metadata": "",19    "log": null,20    "fees": null,21    "fees_split": null,22    "authorization": {23      "authorization_code": "AUTH_JV4T9Wawdj",24      "bin": null,25      "last4": null,26      "exp_month": null,27      "exp_year": null,28      "channel": "direct_debit",29      "card_type": null,30      "bank": "Guaranty Trust Bank",31      "country_code": "NG",32      "brand": null,33      "reusable": true,34      "signature": null,35      "account_name": null36    },37    "customer": {38      "id": 180061682,39      "first_name": "Dami",40      "last_name": "Olukini",41      "email": "damilola@test.com",42      "customer_code": "CUS_24lze1c8i2zl76y",43      "phone": "",44      "metadata": null,45      "risk_action": "default",46      "international_format_phone": null47    },48    "plan": null,49    "split": {},50    "order_id": null,51    "paidAt": "2023-10-24T12:32:30.000Z",52    "createdAt": "2023-10-24T12:32:24.000Z",53    "requested_amount": 10000,54    "pos_transaction_data": null,55    "source": null,56    "fees_breakdown": null,57    "transaction_date": "2023-10-24T12:32:24.000Z",58    "plan_object": {},59    "subaccount": {}60  }61}
```

## Deactivate authorization

You might need to deactivate an authorization either after the completion of a transaction or based on a request from your customer. To do this, make a `POST` request to the [Deactivate AuthorizationAPI](https://paystack.com/docs/api/customer#deactivate-authorization):

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/customer/authorization/deactivate3-H "Authorization: Bearer YOUR_SECRET_KEY"4-H "Content-Type: application/json"5-d '{ 6      "authorization_code": "AUTH_xxxIjkZVj5"7    }'8-X POST
```

```
1{2  "status": true,3  "message": "Authorization has been deactivated"4}
```

###### On this Page

-   [Initialize transaction](https://paystack.com/docs/payments/direct-debit/#initialize-transaction)
-   [Initiate an authorization request](https://paystack.com/docs/payments/direct-debit/#initiate-an-authorization-request)
-   [Supported banks](https://paystack.com/docs/payments/direct-debit/#supported-banks)
-   [Verify authorization status](https://paystack.com/docs/payments/direct-debit/#verify-authorization-status)
-   [Retrying a pending authorization](https://paystack.com/docs/payments/direct-debit/#retrying-a-pending-authorization)
-   [Charge account](https://paystack.com/docs/payments/direct-debit/#charge-account)
-   [Verify charge](https://paystack.com/docs/payments/direct-debit/#verify-charge)
-   [Deactivate authorization](https://paystack.com/docs/payments/direct-debit/#deactivate-authorization)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)