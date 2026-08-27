## Transactions

The Transactions API allows you create and manage payments on your integration.

## Initialize Transaction

Initialize a transaction from your backend

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

An array of payment channels to control what channels you want to make available to the user on the Checkout. Available channels include: `["card", "bank", "apple_pay", "ussd", "qr", "mobile_money", "bank_transfer", "eft", "capitec_pay", "payattitude"]`

The transaction [currency](https://paystack.com/docs/api/#supported-currency). Defaults to your integration currency.

Unique transaction reference. Only `-`, `.`, `=` and alphanumeric characters allowed.

Fully qualified url, e.g. https://example.com/ . Use this to override the callback url provided on the dashboard for this transaction

If transaction is to create a subscription to a predefined plan, provide plan code here. This would invalidate the value provided in `amount`

Number of times to charge customer during subscription to plan

Stringified JSON object of custom data. Kindly check the [Metadata](https://paystack.com/docs/payments/metadata) page for more information.

The split code of the transaction split. e.g. `SPL_98WF13Eb3w`

The code for the subaccount that owns the payment. e.g. `ACCT_8f4s1eq7ml6rlzj`

An amount used to override the split configuration for a single split payment. If set, the amount specified goes to the main account regardless of the split configuration.

Use this param to indicate who bears the transaction charges. Allowed values are: `account` or `subaccount` (defaults to `account`).

```
1#!/bin/sh2url="https://api.paystack.co/transaction/initialize"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "email": "customer@email.com", 7  "amount": "20000"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Authorization URL created",4  "data": {5    "authorization_url": "https://checkout.paystack.com/3ni8kdavz62431k",6    "access_code": "3ni8kdavz62431k",7    "reference": "re4lyvq3s3"8  }9}
```

## Verify Transaction

Confirm the status of a transaction

If you plan to store or make use of the the transaction ID, you should represent it as a unsigned 64-bit integer. To learn more, [check out our changelog](https://paystack.com/docs/changelog/api/#june-2022).

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The transaction reference used to intiate the transaction

```
1#!/bin/sh2url="https://api.paystack.co/transaction/verify/{reference}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Verification successful",4  "data": {5    "id": 4099260516,6    "domain": "test",7    "status": "success",8    "reference": "re4lyvq3s3",9    "receipt_number": null,10    "amount": 40333,11    "message": null,12    "gateway_response": "Successful",13    "paid_at": "2024-08-22T09:15:02.000Z",14    "created_at": "2024-08-22T09:14:24.000Z",15    "channel": "card",16    "currency": "NGN",17    "ip_address": "197.210.54.33",18    "metadata": "",19    "log": {20      "start_time": 1724318098,21      "time_spent": 4,22      "attempts": 1,23      "errors": 0,24      "success": true,25      "mobile": false,26      "input": [],27      "history": [28        {29          "type": "action",30          "message": "Attempted to pay with card",31          "time": 332        },33        {34          "type": "success",35          "message": "Successfully paid with card",36          "time": 437        }38      ]39    },40    "fees": 10283,41    "fees_split": null,42    "authorization": {43      "authorization_code": "AUTH_uh8bcl3zbn",44      "bin": "408408",45      "last4": "4081",46      "exp_month": "12",47      "exp_year": "2030",48      "channel": "card",49      "card_type": "visa ",50      "bank": "TEST BANK",51      "country_code": "NG",52      "brand": "visa",53      "reusable": true,54      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",55      "account_name": null56    },57    "customer": {58      "id": 181873746,59      "first_name": null,60      "last_name": null,61      "email": "demo@test.com",62      "customer_code": "CUS_1rkzaqsv4rrhqo6",63      "phone": null,64      "metadata": null,65      "risk_action": "default",66      "international_format_phone": null67    },68    "plan": null,69    "split": {},70    "order_id": null,71    "paidAt": "2024-08-22T09:15:02.000Z",72    "createdAt": "2024-08-22T09:14:24.000Z",73    "requested_amount": 30050,74    "pos_transaction_data": null,75    "source": null,76    "fees_breakdown": null,77    "connect": null,78    "transaction_date": "2024-08-22T09:14:24.000Z",79    "plan_object": {},80    "subaccount": {}81  }82}
```

## List Transactions

List transactions carried out on your integration

If you plan to store or make use of the transaction ID, you should represent it as a unsigned 64-bit integer. To learn more, [check out our changelog](https://paystack.com/docs/changelog/api/#june-2022).

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

Specify an ID for the customer whose transactions you want to retrieve

The Terminal ID for the transactions you want to retrieve

Filter transactions by status ('failed', 'success', 'abandoned')

A timestamp from which to start listing transaction e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing transaction e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/transaction"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Transactions retrieved",4  "data": [5    {6      "id": 4099260516,7      "domain": "test",8      "status": "success",9      "reference": "re4lyvq3s3",10      "amount": 40333,11      "message": null,12      "gateway_response": "Successful",13      "paid_at": "2024-08-22T09:15:02.000Z",14      "created_at": "2024-08-22T09:14:24.000Z",15      "channel": "card",16      "currency": "NGN",17      "ip_address": "197.210.54.33",18      "metadata": null,19      "log": {20        "start_time": 1724318098,21        "time_spent": 4,22        "attempts": 1,23        "errors": 0,24        "success": true,25        "mobile": false,26        "input": [],27        "history": [28          {29            "type": "action",30            "message": "Attempted to pay with card",31            "time": 332          },33          {34            "type": "success",35            "message": "Successfully paid with card",36            "time": 437          }38        ]39      },40      "fees": 10283,41      "fees_split": null,42      "customer": {43        "id": 181873746,44        "first_name": null,45        "last_name": null,46        "email": "demo@test.com",47        "phone": null,48        "metadata": {49          "custom_fields": [50            {51              "display_name": "Customer email",52              "variable_name": "customer_email",53              "value": "new@email.com"54            }55          ]56        },57        "customer_code": "CUS_1rkzaqsv4rrhqo6",58        "risk_action": "default"59      },60      "authorization": {61        "authorization_code": "AUTH_uh8bcl3zbn",62        "bin": "408408",63        "last4": "4081",64        "exp_month": "12",65        "exp_year": "2030",66        "channel": "card",67        "card_type": "visa ",68        "bank": "TEST BANK",69        "country_code": "NG",70        "brand": "visa",71        "reusable": true,72        "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",73        "account_name": null74      },75      "plan": {},76      "split": {},77      "subaccount": {},78      "order_id": null,79      "paidAt": "2024-08-22T09:15:02.000Z",80      "createdAt": "2024-08-22T09:14:24.000Z",81      "requested_amount": 30050,82      "source": {83        "source": "merchant_api",84        "type": "api",85        "identifier": null,86        "entry_point": "transaction_initialize"87      },88      "connect": null,89      "pos_transaction_data": null90    }91  ],92  "meta": {93    "next": "dW5kZWZpbmVkOjQwMTM3MDk2MzU=",94    "previous": null,95    "perPage": 5096  }97}
```

## Fetch Transaction

Get details of a transaction carried out on your integration

If you plan to store or make use of the the transaction ID, you should represent it as a unsigned 64-bit integer. To learn more, [check out our changelog](https://paystack.com/docs/changelog/api/#june-2022).

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

An ID for the transaction to fetch

```
1#!/bin/sh2url="https://api.paystack.co/transaction/{id}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Transaction retrieved",4  "data": {5    "id": 4099260516,6    "domain": "test",7    "status": "success",8    "reference": "re4lyvq3s3",9    "receipt_number": null,10    "amount": 40333,11    "message": null,12    "gateway_response": "Successful",13    "helpdesk_link": null,14    "paid_at": "2024-08-22T09:15:02.000Z",15    "created_at": "2024-08-22T09:14:24.000Z",16    "channel": "card",17    "currency": "NGN",18    "ip_address": "197.210.54.33",19    "metadata": "",20    "log": {21      "start_time": 1724318098,22      "time_spent": 4,23      "attempts": 1,24      "errors": 0,25      "success": true,26      "mobile": false,27      "input": [],28      "history": [29        {30          "type": "action",31          "message": "Attempted to pay with card",32          "time": 333        },34        {35          "type": "success",36          "message": "Successfully paid with card",37          "time": 438        }39      ]40    },41    "fees": 10283,42    "fees_split": null,43    "authorization": {44      "authorization_code": "AUTH_uh8bcl3zbn",45      "bin": "408408",46      "last4": "4081",47      "exp_month": "12",48      "exp_year": "2030",49      "channel": "card",50      "card_type": "visa ",51      "bank": "TEST BANK",52      "country_code": "NG",53      "brand": "visa",54      "reusable": true,55      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",56      "account_name": null57    },58    "customer": {59      "id": 181873746,60      "first_name": null,61      "last_name": null,62      "email": "demo@test.com",63      "customer_code": "CUS_1rkzaqsv4rrhqo6",64      "phone": null,65      "metadata": {66        "custom_fields": [67          {68            "display_name": "Customer email",69            "variable_name": "customer_email",70            "value": "new@email.com"71          }72        ]73      },74      "risk_action": "default",75      "international_format_phone": null76    },77    "plan": {},78    "subaccount": {},79    "split": {},80    "order_id": null,81    "paidAt": "2024-08-22T09:15:02.000Z",82    "createdAt": "2024-08-22T09:14:24.000Z",83    "requested_amount": 30050,84    "pos_transaction_data": null,85    "source": {86      "type": "api",87      "source": "merchant_api",88      "identifier": null89    },90    "fees_breakdown": null,91    "connect": null92  }93}
```

All authorizations marked as reusable can be charged with this endpoint whenever you need to receive payments

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Valid authorization code to charge

Unique transaction reference. Only `-`, `.`, `=` and alphanumeric characters allowed.

[Currency](https://paystack.com/docs/api/#supported-currency) in which amount should be charged.

Stringified JSON object. Add a `custom_fields` attribute which has an array of objects if you would like the fields to be added to your transaction when displayed on the dashboard. Sample: `{"custom_fields":[{"display_name":"Cart ID","variable_name": "cart_id","value": "8393"}]}`

Send us 'card' or 'bank' or 'card','bank' as an array to specify what options to show the user paying

The code for the subaccount that owns the payment. e.g. `ACCT_8f4s1eq7ml6rlzj`

A flat fee to charge the subaccount for this transaction in the subunit of the [supported currency](https://paystack.com/docs/api/#supported-currency). This overrides the split percentage set when the subaccount was created. Ideally, you will need to use this if you are splitting in flat rates (since subaccount creation only allows for percentage split).

Who bears Paystack charges? `account` or `subaccount` (defaults to `account`).

If you are making a scheduled charge call, it is a good idea to queue them so the processing system does not get overloaded causing transaction processing errors. Send `queue:true` to take advantage of our queued charging.

```
1#!/bin/sh2url="https://api.paystack.co/transaction/charge_authorization"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "email": "customer@email.com", 7  "amount": "20000", 8  "authorization_code": "AUTH_72btv547"9}'10
11curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "amount": 35247,6    "currency": "NGN",7    "transaction_date": "2024-08-22T10:53:49.000Z",8    "status": "success",9    "reference": "0m7frfnr47ezyxl",10    "domain": "test",11    "metadata": "",12    "gateway_response": "Approved",13    "message": null,14    "channel": "card",15    "ip_address": null,16    "log": null,17    "fees": 10247,18    "authorization": {19      "authorization_code": "AUTH_uh8bcl3zbn",20      "bin": "408408",21      "last4": "4081",22      "exp_month": "12",23      "exp_year": "2030",24      "channel": "card",25      "card_type": "visa ",26      "bank": "TEST BANK",27      "country_code": "NG",28      "brand": "visa",29      "reusable": true,30      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",31      "account_name": null32    },33    "customer": {34      "id": 181873746,35      "first_name": null,36      "last_name": null,37      "email": "demo@test.com",38      "customer_code": "CUS_1rkzaqsv4rrhqo6",39      "phone": null,40      "metadata": {41        "custom_fields": [42          {43            "display_name": "Customer email",44            "variable_name": "customer_email",45            "value": "new@email.com"46          }47        ]48      },49      "risk_action": "default",50      "international_format_phone": null51    },52    "plan": null,53    "id": 409949025154  }55}
```

## View Transaction Timeline

View the timeline of a transaction

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The ID or the reference of the transaction

```
1#!/bin/sh2url="https://api.paystack.co/transaction/timeline/{id_or_reference}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Timeline retrieved",4  "data": {5    "start_time": 1724318098,6    "time_spent": 4,7    "attempts": 1,8    "errors": 0,9    "success": true,10    "mobile": false,11    "input": [],12    "history": [13      {14        "type": "action",15        "message": "Attempted to pay with card",16        "time": 317      },18      {19        "type": "success",20        "message": "Successfully paid with card",21        "time": 422      }23    ]24  }25}
```

## Transaction Totals

Total amount received on your account

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing transaction e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing transaction e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/transaction/totals"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Transaction totals",4  "data": {5    "total_transactions": 42670,6    "total_volume": 6617829946,7    "total_volume_by_currency": [8      {9        "currency": "NGN",10        "amount": 661782994611      },12      {13        "currency": "USD",14        "amount": 2800015      }16    ],17    "pending_transfers": 6617829946,18    "pending_transfers_by_currency": [19      {20        "currency": "NGN",21        "amount": 661782994622      },23      {24        "currency": "USD",25        "amount": 2800026      }27    ]28  }29}
```

## Export Transaction

Export a list of transactions carried out on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing transaction e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing transaction e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

Specify an ID for the customer whose transactions you want to retrieve

Filter transactions by status ('failed', 'success', 'abandoned')

Specify the transaction [currency](https://paystack.com/docs/api/#supported-currency) to export

Set to `true` to export only settled transactions. `false` for pending transactions. Leave undefined to export all transactions

An ID for the settlement whose transactions we should export

Specify a payment page's id to export only transactions conducted on said page

```
1#!/bin/sh2url="https://api.paystack.co/transaction/export"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Export successful",4  "data": {5    "path": "https://s3.eu-west-1.amazonaws.com/files.paystack.co/exports/463433/transactions/Integration_name_transactions_1724324423843.csv?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAI7CL5IZL2DJHOPPA%2F20240822%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240822T110023Z&X-Amz-Expires=60&X-Amz-Signature=40525f4f361e07c09a445a1a6888d135758abd507ed988ee744c2d94ea14cf1e&X-Amz-SignedHeaders=host",6    "expiresAt": "2024-08-22 11:01:23"7  }8}
```

## Partial Debit

Retrieve part of a payment from a customer

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Specify the currency you want to debit. Allowed values are NGN or GHS.

Customer's email address (attached to the authorization code)

Unique transaction reference. Only `-`, `.`, `=` and alphanumeric characters allowed.

```
1#!/bin/sh2url="https://api.paystack.co/transaction/partial_debit"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "authorization_code": "AUTH_72btv547", 7  "currency": "NGN", 8  "amount": "20000",9  "email": "customer@email.com"10}'11
12curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "amount": 50000,6    "currency": "NGN",7    "transaction_date": "2024-08-22T11:13:48.000Z",8    "status": "success",9    "reference": "ofuhmnzw05vny9j",10    "domain": "test",11    "metadata": "",12    "gateway_response": "Approved",13    "message": null,14    "channel": "card",15    "ip_address": null,16    "log": null,17    "fees": 10350,18    "authorization": {19      "authorization_code": "AUTH_uh8bcl3zbn",20      "bin": "408408",21      "last4": "4081",22      "exp_month": "12",23      "exp_year": "2030",24      "channel": "card",25      "card_type": "visa ",26      "bank": "TEST BANK",27      "country_code": "NG",28      "brand": "visa",29      "reusable": true,30      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",31      "account_name": null32    },33    "customer": {34      "id": 181873746,35      "first_name": null,36      "last_name": null,37      "email": "demo@test.com",38      "customer_code": "CUS_1rkzaqsv4rrhqo6",39      "phone": null,40      "metadata": {41        "custom_fields": [42          {43            "display_name": "Customer email",44            "variable_name": "customer_email",45            "value": "new@email.com"46          }47        ]48      },49      "risk_action": "default",50      "international_format_phone": null51    },52    "plan": 0,53    "requested_amount": 50000,54    "id": 409954618055  }56}
```