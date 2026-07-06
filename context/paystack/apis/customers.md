## Customers

The Customers API allows you create and manage customers on your integration.

## Create Customer

Create a customer on your integration

The `first_name`, `last_name` and `phone` are optional parameters. However, when creating a customer that would be assigned a Dedicated Virtual Account and your business category falls under **Betting**, **Financial services**, and **General Service**, then these parameters become compulsory.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

A set of key/value pairs that you can attach to the customer. It can be used to store additional information in a structured format.

```
1#!/bin/sh2url="https://api.paystack.co/customer"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6    "email": "customer@example.com",7    "first_name": "Zero",8    "last_name": "Sum",9    "phone": "+2348123456789"10}'11
12curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Customer created",4  "data": {5    "email": "customer@email.com",6    "integration": 100032,7    "domain": "test",8    "customer_code": "CUS_xnxdt6s1zg1f4nx",9    "id": 1173,10    "identified": false,11    "identifications": null,12    "createdAt": "2016-03-29T20:03:09.584Z",13    "updatedAt": "2016-03-29T20:03:09.584Z"14  }15}
```

## List Customer

List customers available on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing customers e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing customers e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/customer"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Customers retrieved",4  "data": [5    {6      "integration": 463433,7      "first_name": null,8      "last_name": null,9      "email": "dom@gmail.com",10      "phone": null,11      "metadata": null,12      "domain": "test",13      "customer_code": "CUS_c6wqvwmvwopw4ms",14      "risk_action": "default",15      "id": 90758908,16      "createdAt": "2022-08-15T13:46:39.000Z",17      "updatedAt": "2022-08-15T13:46:39.000Z"18    },19    {20      "integration": 463433,21      "first_name": "Okiki",22      "last_name": "Sample",23      "email": "okiki@sample.com",24      "phone": "09048829123",25      "metadata": {},26      "domain": "test",27      "customer_code": "CUS_rki2ccocw7g8lsj",28      "risk_action": "default",29      "id": 90758301,30      "createdAt": "2022-08-15T13:42:52.000Z",31      "updatedAt": "2022-08-15T13:42:52.000Z"32    },33    {34      "integration": 463433,35      "first_name": "lukman",36      "last_name": "calle",37      "email": "lukman@calle.co",38      "phone": "08922383034",39      "metadata": {},40      "domain": "test",41      "customer_code": "CUS_hpxsz8c1if90quo",42      "risk_action": "default",43      "id": 90747194,44      "createdAt": "2022-08-15T12:31:13.000Z",45      "updatedAt": "2022-08-15T12:31:13.000Z"46    }47  ],48  "meta": {49    "next": "Y3VzdG9tZXI6OTAyMjU4MDk=",50    "previous": null,51    "perPage": 352  }53}
```

## Fetch Customer

Get details of a customer on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

An `email` or `customer code` for the customer you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/customer/{email_or_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Customer retrieved",4  "data": {5    "transactions": [],6    "subscriptions": [],7    "authorizations": [8      {9        "authorization_code": "AUTH_ekk8t49ogj",10        "bin": "408408",11        "last4": "4081",12        "exp_month": "12",13        "exp_year": "2030",14        "channel": "card",15        "card_type": "visa ",16        "bank": "TEST BANK",17        "country_code": "NG",18        "brand": "visa",19        "reusable": true,20        "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",21        "account_name": null22      }23    ],24    "first_name": null,25    "last_name": null,26    "email": "dom@gmail.com",27    "phone": null,28    "metadata": null,29    "domain": "test",30    "customer_code": "CUS_c6wqvwmvwopw4ms",31    "risk_action": "default",32    "id": 90758908,33    "integration": 463433,34    "createdAt": "2022-08-15T13:46:39.000Z",35    "updatedAt": "2022-08-15T13:46:39.000Z",36    "created_at": "2022-08-15T13:46:39.000Z",37    "updated_at": "2022-08-15T13:46:39.000Z",38    "total_transactions": 0,39    "total_transaction_value": [],40    "dedicated_account": null,41    "identified": false,42    "identifications": null43  }44}
```

## Update Customer

Update a customer's details on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

A set of key/value pairs that you can attach to the customer. It can be used to store additional information in a structured format.

```
1#!/bin/sh2url="https://api.paystack.co/customer/{code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "first_name": "BoJack"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Customer updated",4  "data": {5    "integration": 100032,6    "first_name": "BoJack",7    "last_name": "Horseman",8    "email": "bojack@horsinaround.com",9    "phone": null,10    "metadata": {11      "photos": [12        {13          "type": "twitter",14          "typeId": "twitter",15          "typeName": "Twitter",16          "url": "https://d2ojpxxtu63wzl.cloudfront.net/static/61b1a0a1d4dda2c9fe9e165fed07f812_a722ae7148870cc2e33465d1807dfdc6efca33ad2c4e1f8943a79eead3c21311",17          "isPrimary": true18        }19      ]20    },21    "identified": false,22    "identifications": null,23    "domain": "test",24    "customer_code": "CUS_xnxdt6s1zg1f4nx",25    "id": 1173,26    "transactions": [],27    "subscriptions": [],28    "authorizations": [],29    "createdAt": "2016-03-29T20:03:09.000Z",30    "updatedAt": "2016-03-29T20:03:10.000Z"31  }32}
```

## Validate Customer

Validate a customer's identity

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

Email, or customer code of customer to be identified

### Body Parameters

Predefined types of identification. Only `bank_account` is supported at the moment

Customer's identification number

2 letter country code of identification issuer

Customer's Bank Verification Number

You can get the list of Bank Codes by calling the [List Banks](https://paystack.com/docs/api/miscellaneous#bank) endpoint. (required if `type` is `bank_account`)

Customer's bank account number. (required if `type` is `bank_account`)

```
1#!/bin/sh2url="https://api.paystack.co/customer/{customer_code}/identification"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "country": "NG",7  "type": "bank_account",8  "account_number": "0123456789",9  "bvn": "20012345677",10  "bank_code": "007",11  "first_name": "Asta",12  "last_name": "Lavista"13}'14
15curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Customer Identification in progress"4}
```

## Whitelist/Blacklist Customer

Whitelist or blacklist a customer on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Customer's code, or email address

One of the possible risk actions \[ `default`, `allow`, `deny` \]. `allow` to whitelist. `deny` to blacklist. Customers start with a `default` risk action.

```
1#!/bin/sh2url="https://api.paystack.co/customer/set_risk_action"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "customer": "CUS_xr58yrr2ujlft9k", 7  "risk_action": "allow"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Customer updated",4  "data": {5    "first_name": "Peter",6    "last_name": "Griffin",7    "email": "peter@grif.com",8    "phone": null,9    "metadata": {},10    "domain": "test",11    "identified": false,12    "identifications": null,13    "customer_code": "CUS_xr58yrr2ujlft9k",14    "risk_action": "allow",15    "id": 2109,16    "integration": 100032,17    "createdAt": "2016-01-26T13:43:38.000Z",18    "updatedAt": "2016-08-23T03:56:43.000Z"19  }20}
```

Initiate a request to create a reusable authorization code for recurring transactions.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

`direct-debit` is the only supported option for now

Fully qualified url (e.g. https://example.com/) to redirect your customer to.

Holds the customer's account details.

The customer's account number

The code representing the customer's bank.

Represents the customer's address.

```
1#!/bin/sh2url="https://api.paystack.co/customer/authorization/initialize"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "email": "ravi@demo.com",7  "channel": "direct_debit",8  "callback_url": "http://test.url.com"9}'10
11curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Authorization initialized",4  "data": {5    "redirect_url": "https://checkout.paystack.com/82t4mp5b5mfn51h",6    "access_code": "82t4mp5b5mfn51h",7    "reference": "dfbzfotsrbv4n5s82t4mp5b5mfn51h"8  }9}
```

## Verify Authorization

Check the status of an authorization request.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The reference returned in the initialization response

```
1#!/bin/sh2url="https://api.paystack.co/customer/authorization/verify/{reference}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Authorization retrieved successfully",4  "data": {5    "authorization_code": "AUTH_JV4T9Wawdj",6    "channel": "direct_debit",7    "bank": "Guaranty Trust Bank",8    "active": true,9    "customer": {10      "code": "CUS_24lze1c8i2zl76y",11      "email": "ravi@demo.com"12    }13  }14}
```

## Initialize Direct Debit

Initialize the process of linking an account to a customer for Direct Debit transactions.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

An object that contains the customer’s account details

The customer's account number

The code representing the customer's bank.

An object that contains the customer’s address information

```
1#!/bin/sh2url="https://api.paystack.co/customer/{id}/initialize-direct-debit"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "account": {7		"number": "0123456789",8		"bank_code": "058"9	},10	"address": {11		"street": "Some Where",12		"city": "Ikeja",13		"state": "Lagos"14	}15}'16
17curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Authorization initialized",4  "data": {5    "redirect_url": "https://link.paystack.com/ll6b0szngj1f27k",6    "access_code": "ll6b0szngj1f27k",7    "reference": "1er945lpy4txyki"8  }9}
```

## Direct Debit Activation Charge

Trigger an activation charge on an inactive mandate on behalf of your customer.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

The customer ID attached to the authorization

### Body Parameters

The authorization ID gotten from the initiation response

```
1#!/bin/sh2curl https://api.paystack.co/customer/{id}/directdebit-activation-charge3-H "Authorization: Bearer YOUR_SECRET_KEY"4-H "Content-Type: application/json"5-d '{ 6        "authorization_id" : 10693099177    }'8-X PUT
```

```
1{2  "status": true,3  "message": "Mandate is queued for retry"4}
```

## Fetch Mandate Authorizations

Get the list of direct debit mandates associated with a customer.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The customer ID for the authorizations to fetch

```
1#!/bin/sh2url="https://api.paystack.co/customer/{id}/directdebit-mandate-authorizations"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Mandate authorizations retrieved successfully",4  "data": [5    {6      "id": 164098,7      "status": "active",8      "mandate_id": 512003,9      "authorization_id": 110049014,10      "authorization_code": "AUTH_8Lol0pNt14",11      "integration_id": 463433,12      "account_number": "0123456789",13      "bank_code": "032",14      "bank_name": null,15      "customer": {16        "id": 43975700,17        "customer_code": "CUS_2eusy8uwe34s23fy",18        "email": "customer@email.com",19        "first_name": "Smith",20        "last_name": "Bel"21      },22      "authorized_at": "2024-09-27T10:57:53.824Z"23    }24  ],25  "meta": {26    "per_page": 50,27    "next": null,28    "count": 1,29    "total": 130  }31}
```

## Deactivate Authorization

Deactivate an authorization for any payment channel.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Authorization code to be deactivated

```
1#!/bin/sh2url="https://api.paystack.co/customer/authorization/deactivate"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "authorization_code": "AUTH_xxxIjkZVj5"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Authorization has been deactivated"4}
```