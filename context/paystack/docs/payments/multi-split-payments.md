# Multi-split Payments

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

Multi-split enables merchants to split the settlement for a transaction across their payout account, and one or more subaccounts.

You can implement multi-split by:

1.  [Creating a transaction split](https://paystack.com/docs/payments/multi-split-payments/#creating-a-transaction-split)
2.  [Using transaction splits with payments](https://paystack.com/docs/payments/multi-split-payments/#using-transaction-splits-with-payments)

Merchants will be able to create and manage their transaction splits using the [Transaction SplitsAPI](https://paystack.com/docs/api/split) endpoints and their [Paystack Dashboard](https://dashboard.paystack.com/#/transaction-splits).

## Creating a transaction split

##### Before you begin

Transaction split depends on subaccounts to work its magic. If you already have subaccounts, you can proceed. Otherwise, you'll need to [create a subaccount](https://paystack.com/docs/payments/split-payments/#create-a-subaccount) first.

You can create a transaction split by sending a request to the [Create SplitAPI](https://paystack.com/docs/api/split#create) endpoint with the following information:

-   The type of split (`flat` or `percentage`)
-   An array of subaccounts and their respective shares

cURLNodePHP

Show Response

```
1#!/bin/sh2url="https://api.paystack.co/split"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "name":"Halfsies", 7  "type":"percentage", 8  "currency": "NGN",9  "subaccounts":[{10    "subaccount": "ACCT_6uujpqtzmnufzkw",11    "share": 5012  }]13}'14
15curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Split created",4  "data": {5    "id": 2703655,6    "name": "Halfsies",7    "type": "percentage",8    "currency": "NGN",9    "integration": 463433,10    "domain": "test",11    "split_code": "SPL_RcScyW5jp2",12    "active": true,13    "bearer_type": "all",14    "createdAt": "2024-08-26T11:38:47.506Z",15    "updatedAt": "2024-08-26T11:38:47.506Z",16    "is_dynamic": false,17    "subaccounts": [18      {19        "subaccount": {20          "id": 1151727,21          "subaccount_code": "ACCT_6uujpqtzmnufzkw",22          "business_name": "Oasis Global",23          "description": "Oasis Global",24          "primary_contact_name": null,25          "primary_contact_email": null,26          "primary_contact_phone": null,27          "metadata": null,28          "settlement_bank": "Guaranty Trust Bank",29          "currency": "NGN",30          "account_number": "0123456047"31        },32        "share": 5033      }34    ],35    "total_subaccounts": 136  }37}
```

##### Warning

1.  We don't accept decimal figures for subaccounts shares if the split type is `percentage`
2.  The sum of the `percentage` splits shouldn't be more than 100%
3.  Share amounts for `flat` splits should be in the subunit of the [supported currency](https://paystack.com/api#supported-currency)
4.  The sum of the `flat` splits shouldn't be more than the transaction amount
5.  A split can either be a `flat` or `percentage` type, not both

Through the APIs, you can add, remove, and update the subaccounts in a Split, as well as change the active state of a Split.

##### Updating a Split

You can't change the type of a split. Instead, you can deactivate the Split and create a new Split with a different split type.

## Using transaction splits with payments

After creating a transaction split, you can make use of it when:

1.  [Initializing a transaction](https://paystack.com/docs/payments/multi-split-payments/#initializing-a-transaction)
2.  [Charging an authorization](https://paystack.com/docs/payments/multi-split-payments/#charging-an-authorization)

### Initializing a transaction

You can initialize a transaction with a Transaction Split by adding a `split_code` to the payload you send to the [Transaction InitializeAPI](https://paystack.com/docs/api/transaction#initialize) endpoint.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transaction/initialize2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "20000", 6      "split_code": "SPL_98WF13Eekw" 7    }'8-X POST
```

```
1{2  "status": true,3  "message": "Authorization URL created",4  "data": {5    "authorization_url": "https://checkout.paystack.com/nkdks46nymizns7",6    "access_code": "nkdks46nymizns7",7    "reference": "nms6uvr1pl"8  }9}
```

### Charging an authorization

To charge an authorization with a Transaction Split, add a `split_code` to the payload you send to the [Charge AuthorizationAPI](https://paystack.com/docs/api/transaction#charge-authorization) endpoint.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transaction/charge_authorization2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "authorization_code" : "AUTH_12abc345de", "email": "mail@mail.com", 5      "amount": "300000", "split_code": "SPL_UO2vBzEqHW" }'6-X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "amount": 300000,6    "currency": "NGN",7    "transaction_date": "2020-05-27T11:45:03.000Z",8    "status": "success",9    "reference": "cn65lf4ixmkzvda",10    "domain": "test",11    "metadata": "",12    "gateway_response": "Approved",13    "message": null,14    "channel": "card",15    "ip_address": null,16    "log": null,17    "fees": 14500,18    "authorization": {19      "authorization_code": "AUTH_12abc345de",20      "bin": "408408",21      "last4": "4081",22      "exp_month": "12",23      "exp_year": "2020",24      "channel": "card",25      "card_type": "visa DEBIT",26      "bank": "Test Bank",27      "country_code": "NG",28      "brand": "visa",29      "reusable": true,30      "signature": "SIG_2Gvc6pNuzJmj4TCchXfp",31      "account_name": null32    },33    "customer": {34      "id": 23215815,35      "first_name": null,36      "last_name": null,37      "email": "mail@mail.com",38      "customer_code": "CUS_wt0zmhzb0xqd4nr",39      "phone": null,40      "metadata": null,41      "risk_action": "default"42    },43    "plan": null,44    "id": 69610592845  }46}
```

## Dynamic splits

Sometimes, you can't determine a split configuration until later in the purchase flow. With dynamic splits, you can create splits on the fly. This can be achieved by passing a `split` object to the [Transaction InitializeAPI](https://paystack.com/docs/api/transaction#initialize) endpoint or to [popup](https://paystack.com/docs/payments/accept-payments/#popup). The `split` object can take the following properties:

| Param | Required? | Description |
| --- | --- | --- |
| `type` | Yes | Value can be `flat` or `percentage` |
| `bearer_type` | Yes | Value can be `all`, `all-proportional`, `account` or `subaccount` |
| `subaccounts` | Yes | An array of subaccount object. For example `{"subaccount": 'ACCT_', "share": 60}` |
| `bearer_subaccount` | No | Subaccount code of the bearer. It should be specified if `bearer_type` is `subaccount` |
| `reference` | No | Unique reference of the split |

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transaction/initialize2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "20000", 6      "split": {7        "type": "flat",8        "bearer_type": "account",9        "subaccounts": [10          {11            "subaccount": "ACCT_pwwualwty4nhq9d",12            "share": 600013          },14          {15            "subaccount": "ACCT_hdl8abxl8drhrl3",16            "share": 400017          },18        ]19      } 20}'21-X POST
```

```
1{2  "status": true,3  "message": "Authorization URL created",4  "data": {5    "authorization_url": "https://checkout.paystack.com/nkdks46nymizns7",6    "access_code": "nkdks46nymizns7",7    "reference": "nms6uvr1pl"8  }9}
```

## Webhooks

For successful transactions, we'll populate a `split` parameter in the `charge.success` webhook with information on the Split:

-   JSON

```
1{2  "event": "charge.success",3  "data": {4    "id": 697123356,5    "domain": "live",6    "status": "success",7    "reference": "12k81tq3my",8    "amount": 10000,9    "message": null,10    "gateway_response": "Approved",11    "paid_at": "2020-05-28T13:54:57.000Z",12    "split": {13      "id": 10,14      "name": "Example Split",15      "split_code": "SPL_98WF13Eekw",16      "formula": {17        "type": "percentage",18        "subaccounts": [19          {20            "share": 20,21            "subaccount_code": "ACCT_zpu16k4uhxycmxu",22            "id": 12850,23            "name": "Ayobami UBA"24          }25        ],26        "integration": 8027      },28      "shares": {29        "paystack": 140,30        "subaccounts": [31          {32            "amount": 2000,33            "subaccount_code": "ACCT_zpu16k4uhxycmxu",34            "id": 1285035          }36        ],37        "integration": 786038      }39    }40  }41}
```

## Fees on multi-split

By default, the main account bears the Paystack transaction fees. However, you can change this by setting the `bearer_type` to either `account`, `all` or `subaccount`.

| Bearer Type | Description |
| --- | --- |
| `all` | Fees will be shared equally by the main account and all subaccounts. |
| `all-proportional` | Fees will be charged according to the share of the main account and subaccounts. |
| `account` | Fees will be charged to the main account only. |
| `subaccount` | Only the subaccount set in the `bearer_subaccount` will be charged |

##### Bearer Subaccount

A required parameter when the `bearer_type` is set to `subaccount`. The value of `bearer_subaccount` must be a subaccount code that's in the split group.

###### On this Page

-   [Creating a transaction split](https://paystack.com/docs/payments/multi-split-payments/#creating-a-transaction-split)
-   [Using transaction splits with payments](https://paystack.com/docs/payments/multi-split-payments/#using-transaction-splits-with-payments)
-   [Dynamic splits](https://paystack.com/docs/payments/multi-split-payments/#dynamic-splits)
-   [Webhooks](https://paystack.com/docs/payments/multi-split-payments/#webhooks)
-   [Fees on multi-split](https://paystack.com/docs/payments/multi-split-payments/#fees-on-multi-split)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)