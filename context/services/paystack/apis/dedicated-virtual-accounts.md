## Dedicated Virtual Accounts

The Dedicated Virtual Account API enables Nigerian and Ghanaian merchants to manage unique payment accounts of their customers.

Create a dedicated virtual account for an existing customer

You can get supported banks by calling the [Fetch Providers](#providers) endpoint.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

The bank slug for preferred bank. To get a list of available banks, use the [List Providers](#providers) endpoint.

Subaccount code of the account you want to split the transaction with

Split code consisting of the lists of accounts you want to split the transaction with

```
1#!/bin/sh2url="https://api.paystack.co/dedicated_account"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "customer": 481193, 6        "preferred_bank":"titan-paystack"7      }'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "NUBAN successfully created",4  "data": {5    "bank": {6      "name": "Paystack-Titan",7      "id": 629,8      "slug": "titan-paystack"9    },10    "account_name": "KAROKART / RHODA CHURCH",11    "account_number": "9930000737",12    "assigned": true,13    "currency": "NGN",14    "metadata": null,15    "active": true,16    "id": 253,17    "created_at": "2019-12-12T12:39:04.000Z",18    "updated_at": "2020-01-06T15:51:24.000Z",19    "assignment": {20      "integration": 100043,21      "assignee_id": 7454289,22      "assignee_type": "Customer",23      "expired": false,24      "account_type": "PAY-WITH-TRANSFER-RECURRING",25      "assigned_at": "2020-01-06T15:51:24.764Z"26    },27    "customer": {28      "id": 7454289,29      "first_name": "RHODA",30      "last_name": "CHURCH",31      "email": "rhodachurch@email.com",32      "customer_code": "CUS_kpb3qj71u1m0rw8",33      "phone": "+2349053267565",34      "risk_action": "default"35    }36  }37}
```

## Assign Dedicated Virtual Account

With this endpoint, you can create a customer, validate the customer, and assign a DVA to the customer.

You can get supported banks by calling the [Fetch Providers](#providers) endpoint.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

The bank slug for preferred bank. To get a list of available banks, use the [List Providers](#providers) endpoint.

Currently accepts `NG` and `GH` only

Customer's account number

Customer's Bank Verification Number (Nigeria only)

Subaccount code of the account you want to split the transaction with

Split code consisting of the lists of accounts you want to split the transaction with

```
1#!/bin/sh2url="https://api.paystack.co/dedicated_account/assign"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6      "email": "janedoe@test.com",7      "first_name": "Jane",8      "middle_name": "Karen",9      "last_name": "Doe",10      "phone": "+2348100000000",11      "preferred_bank": "test-bank",12      "country": "NG"13    }'14
15curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Assign dedicated account in progress"4}
```

## List Dedicated Virtual Accounts

List dedicated virtual accounts available on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Status of the dedicated virtual account

The currency of the dedicated virtual account. Only `NGN` and `GHS` are currently allowed

The bank's slug in lowercase, without spaces e.g. `wema-bank`

```
1#!/bin/sh2url="https://api.paystack.co/dedicated_account"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Managed accounts successfully retrieved",4  "data": [5    {6      "customer": {7        "id": 1530104,8        "first_name": "yinka",9        "last_name": "Ojo",10        "email": "hello@company.co",11        "customer_code": "CUS_dy1r7ts03zixbq5",12        "phone": "08154239386",13        "risk_action": "default",14        "international_format_phone": null15      },16      "bank": {17        "name": "Paystack-Titan",18        "id": 629,19        "slug": "titan-paystack"20      },21      "id": 173,22      "account_name": "KAROKART/A YINKA",23      "account_number": "9930020212",24      "created_at": "2019-12-09T13:31:38.000Z",25      "updated_at": "2020-06-11T14:04:28.000Z",26      "currency": "NGN",27      "split_config": {28        "subaccount": "ACCT_xdrne0tcvr5jkei"29      },30      "active": true,31      "assigned": true32    }33  ],34  "meta": {35    "total": 1,36    "skipped": 0,37    "perPage": 50,38    "page": 1,39    "pageCount": 140  }41}
```

## Fetch Dedicated Virtual Account

Get details of a dedicated virtual account on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

ID of dedicated virtual account

```
1#!/bin/sh2url="https://api.paystack.co/dedicated_account/:dedicated_account_id"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Managed account successfully retrieved",4  "data": {5    "customer": {6      "id": 42200598,7      "first_name": "Rose",8      "last_name": "Sharon",9      "email": "rose@sharon.com",10      "customer_code": "CUS_lfq5hi7rsnub7gl",11      "phone": "8091234650",12      "metadata": {13        "calling_code": "+234"14      },15      "risk_action": "default",16      "international_format_phone": null17    },18    "bank": {19      "name": "Paystack-Titan",20      "id": 629,21      "slug": "titan-paystack"22    },23    "id": 1234553,24    "account_name": "BOOMBOOMINDUS/Sharon Rose",25    "account_number": "1234709987",26    "created_at": "2021-02-13T00:29:50.000Z",27    "updated_at": "2021-03-30T10:03:54.000Z",28    "currency": "NGN",29    "split_config": "{\"subaccount\":\"ACCT_f651f39t7x9a9c6\"}",30    "active": true,31    "assigned": true32  }33}
```

## Requery Dedicated Account

Requery Dedicated Virtual Account for new transactions

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Virtual account number to requery

The bank's slug in lowercase, without spaces e.g. `wema-bank`

The day the transfer was made in `YYYY-MM-DD` format

```
1#!/bin/sh2accountNumber="1234567890"3providerSlug="example-provider"4date="2023-05-30"5
6url="https://api.paystack.co/dedicated_account/requery?account_number=$accountNumber&provider_slug=$providerSlug&date=$date"7authorization="Authorization: Bearer YOUR_SECRET_KEY"8content_type="Content-Type: application/json"9
10curl "$url" -H "$authorization" -H "$content_type" -X GET
```

```
1{2  "status": true,3  "message": "We are checking the status of your transfer. We will send you a notification once it is confirmed"4}
```

## Deactivate Dedicated Account

Deactivate a dedicated virtual account on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

ID of dedicated virtual account

```
1#!/bin/sh2url="https://api.paystack.co/dedicated_account/:dedicated_account_id"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X DELETE
```

```
1{2  "status": true,3  "message": "Managed Account Successfully Unassigned",4  "data": {5    "bank": {6      "name": "Paystack-Titan",7      "id": 629,8      "slug": "titan-paystack"9    },10    "account_name": "KAROKART/A YINKA",11    "account_number": "9930020212",12    "assigned": false,13    "currency": "NGN",14    "metadata": null,15    "active": true,16    "id": 173,17    "created_at": "2019-12-09T13:31:38.000Z",18    "updated_at": "2020-08-28T10:04:25.000Z",19    "assignment": {20      "assignee_id": 1530104,21      "assignee_type": "Integration",22      "assigned_at": "2019-12-09T13:40:21.000Z",23      "integration": 100043,24      "account_type": "PAY-WITH-TRANSFER-RECURRING"25    }26  }27}
```

## Split Dedicated Account Transaction

Split a dedicated virtual account transaction with one or more accounts

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Subaccount code of the account you want to split the transaction with

Split code consisting of the lists of accounts you want to split the transaction with

The bank slug for preferred bank. To get a list of available banks, use the [List Providers](#providers) endpoint

```
1#!/bin/sh2url="https://api.paystack.co/dedicated_account"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "customer": 481193, 6        "preferred_bank":"titan-paystack", 7        "split_code": "SPL_e7jnRLtzla" 8      }'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Assigned Managed Account Successfully Created",4  "data": {5    "bank": {6      "name": "Paystack-Titan",7      "id": 629,8      "slug": "titan-paystack"9    },10    "account_name": "KAROKART/YINKA ADE",11    "account_number": "6731105168",12    "assigned": true,13    "currency": "NGN",14    "metadata": null,15    "active": true,16    "id": 97,17    "created_at": "2019-11-13T13:52:39.000Z",18    "updated_at": "2020-03-17T07:52:23.000Z",19    "assignment": {20      "integration": 100043,21      "assignee_id": 17328,22      "assignee_type": "Customer",23      "expired": false,24      "account_type": "PAY-WITH-TRANSFER-RECURRING",25      "assigned_at": "2020-03-17T07:52:23.023Z",26      "expired_at": null27    },28    "split_config": {29      "split_code": "SPL_e7jnRLtzla"30    },31    "customer": {32      "id": 17328,33      "first_name": "YINKA",34      "last_name": "ADE",35      "email": "yinka@testemail.com",36      "customer_code": "CUS_xxxxxxxx",37      "phone": null,38      "metadata": null,39      "risk_action": "default"40    }41  }42}
```

## Remove Split from Dedicated Account

If you've previously set up split payment for transactions on a dedicated virtual account, you can remove it with this endpoint

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Dedicated virtual account number

```
1#!/bin/sh2url="https://api.paystack.co/dedicated_account/split"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{6 "account_number": "0033322211" 7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X DELETE10
11
```

```
1{2  "status": "success",3  "message": "Subaccount unassigned",4  "data": {5    "id": 22173,6    "split_config": {},7    "account_name": "KAROKART/YINKA ADE",8    "account_number": "0033322211",9    "currency": "NGN",10    "assigned": true,11    "active": true,12    "createdAt": "2020-03-11T15:14:00.707Z",13    "updatedAt": "2020-03-11T15:14:00.707Z"14  }15}
```

## Fetch Bank Providers

Get available bank providers for a dedicated virtual account

### Headers

Set value to `Bearer SECRET_KEY`

```
1#!/bin/sh2url="https://api.paystack.co/dedicated_account/available_providers"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Dedicated account providers retrieved",4  "data": [5    {6      "provider_slug": "titan-paystack",7      "bank_id": 629,8      "bank_name": "Paystack-Titan",9      "id": 910    },11    {12      "provider_slug": "wema-bank",13      "bank_id": 20,14      "bank_name": "Wema Bank",15      "id": 516    }17  ]18}
```