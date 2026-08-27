## Subscriptions

The Subscriptions API allows you create and manage recurring payment on your integration.

## Create Subscription

Create a subscription on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Customer's email address or customer code

If customer has multiple authorizations, you can set the desired authorization you wish to use for this subscription here. If this is not supplied, the customer's most recent authorization would be used

Set the date for the first debit. (ISO 8601 format) e.g. `2017-05-16T00:30:13+01:00`

```
1#!/bin/sh2url="https://api.paystack.co/subscription"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "customer": "CUS_xnxdt6s1zg1f4nx", 7  "plan": "PLN_gx2wn530m0i3w3m"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Subscription successfully created",4  "data": {5    "customer": 1173,6    "plan": 28,7    "integration": 100032,8    "domain": "test",9    "start": 1459296064,10    "status": "active",11    "quantity": 1,12    "amount": 50000,13    "authorization": {14      "authorization_code": "AUTH_6tmt288t0o",15      "bin": "408408",16      "last4": "4081",17      "exp_month": "12",18      "exp_year": "2020",19      "channel": "card",20      "card_type": "visa visa",21      "bank": "TEST BANK",22      "country_code": "NG",23      "brand": "visa",24      "reusable": true,25      "signature": "SIG_uSYN4fv1adlAuoij8QXh",26      "account_name": "BoJack Horseman"27    },28    "subscription_code": "SUB_vsyqdmlzble3uii",29    "email_token": "d7gofp6yppn3qz7",30    "id": 9,31    "createdAt": "2016-03-30T00:01:04.687Z",32    "updatedAt": "2016-03-30T00:01:04.687Z"33  }34}
```

## List Subscriptions

List subscriptions available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

```
1#!/bin/sh2url="https://api.paystack.co/subscription"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Subscriptions retrieved",4  "data": [5    {6      "customer": {7        "first_name": "BoJack",8        "last_name": "Horseman",9        "email": "bojack@horseman.com",10        "phone": "",11        "metadata": null,12        "domain": "test",13        "customer_code": "CUS_hdhye17yj8qd2tx",14        "risk_action": "default",15        "id": 84312,16        "integration": 100073,17        "createdAt": "2016-10-01T10:59:52.000Z",18        "updatedAt": "2016-10-01T10:59:52.000Z"19      },20      "plan": {21        "domain": "test",22        "name": "Weekly small chops",23        "plan_code": "PLN_0as2m9n02cl0kp6",24        "description": "Small chops delivered every week",25        "amount": 27000,26        "interval": "weekly",27        "send_invoices": true,28        "send_sms": true,29        "hosted_page": false,30        "hosted_page_url": null,31        "hosted_page_summary": null,32        "currency": "NGN",33        "migrate": null,34        "id": 1716,35        "integration": 100073,36        "createdAt": "2016-10-01T10:59:11.000Z",37        "updatedAt": "2016-10-01T10:59:11.000Z"38      },39      "integration": 123456,40      "authorization": {41        "authorization_code": "AUTH_6tmt288t0o",42        "bin": "408408",43        "last4": "4081",44        "exp_month": "12",45        "exp_year": "2020",46        "channel": "card",47        "card_type": "visa visa",48        "bank": "TEST BANK",49        "country_code": "NG",50        "brand": "visa",51        "reusable": true,52        "signature": "SIG_uSYN4fv1adlAuoij8QXh",53        "account_name": "BoJack Horseman"54      },55      "domain": "test",56      "start": 1475319599,57      "status": "active",58      "quantity": 1,59      "amount": 27000,60      "subscription_code": "SUB_6phdx225bavuwtb",61      "email_token": "ore84lyuwcv2esu",62      "easy_cron_id": "275226",63      "cron_expression": "0 0 * * 6",64      "next_payment_date": "2016-10-15T00:00:00.000Z",65      "open_invoice": "INV_qc875pkxpxuyodf",66      "id": 4192,67      "createdAt": "2016-10-01T10:59:59.000Z",68      "updatedAt": "2016-10-12T07:45:14.000Z"69    }70  ],71  "meta": {72    "total": 1,73    "skipped": 0,74    "perPage": 50,75    "page": 1,76    "pageCount": 177  }78}
```

## Fetch Subscription

Get details of a subscription on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The subscription `ID` or `code` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/subscription/{id_or_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Subscription retrieved successfully",4  "data": {5    "invoices": [],6    "customer": {7      "first_name": "BoJack",8      "last_name": "Horseman",9      "email": "bojack@horsinaround.com",10      "phone": null,11      "metadata": {12        "photos": [13          {14            "type": "twitter",15            "typeId": "twitter",16            "typeName": "Twitter",17            "url": "https://d2ojpxxtu63wzl.cloudfront.net/static/61b1a0a1d4dda2c9fe9e165fed07f812_a722ae7148870cc2e33465d1807dfdc6efca33ad2c4e1f8943a79eead3c21311",18            "isPrimary": false19          }20        ]21      },22      "domain": "test",23      "customer_code": "CUS_xnxdt6s1zg1f4nx",24      "id": 1173,25      "integration": 100032,26      "createdAt": "2016-03-29T20:03:09.000Z",27      "updatedAt": "2016-03-29T20:53:05.000Z"28    },29    "plan": {30      "domain": "test",31      "name": "Monthly retainer (renamed)",32      "plan_code": "PLN_gx2wn530m0i3w3m",33      "description": null,34      "amount": 50000,35      "interval": "monthly",36      "send_invoices": true,37      "send_sms": true,38      "hosted_page": false,39      "hosted_page_url": null,40      "hosted_page_summary": null,41      "currency": "NGN",42      "id": 28,43      "integration": 100032,44      "createdAt": "2016-03-29T22:42:50.000Z",45      "updatedAt": "2016-03-29T23:51:41.000Z"46    },47    "integration": 100032,48    "authorization": {49      "authorization_code": "AUTH_6tmt288t0o",50      "bin": "408408",51      "last4": "4081",52      "exp_month": "12",53      "exp_year": "2020",54      "channel": "card",55      "card_type": "visa visa",56      "bank": "TEST BANK",57      "country_code": "NG",58      "brand": "visa",59      "reusable": true,60      "signature": "SIG_uSYN4fv1adlAuoij8QXh",61      "account_name": "BoJack Horseman"62    },63    "domain": "test",64    "start": 1459296064,65    "status": "active",66    "quantity": 1,67    "amount": 50000,68    "subscription_code": "SUB_vsyqdmlzble3uii",69    "email_token": "d7gofp6yppn3qz7",70    "easy_cron_id": null,71    "cron_expression": "0 0 28 * *",72    "next_payment_date": "2016-04-28T07:00:00.000Z",73    "open_invoice": null,74    "id": 9,75    "createdAt": "2016-03-30T00:01:04.000Z",76    "updatedAt": "2016-03-30T00:22:58.000Z"77  }78}
```

## Enable Subscription

Enable a subscription on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

```
1#!/bin/sh2url="https://api.paystack.co/subscription/enable"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "code": "SUB_vsyqdmlzble3uii", 7  "token": "d7gofp6yppn3qz7"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Subscription enabled successfully"4}
```

## Disable Subscription

Disable a subscription on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

```
1#!/bin/sh2url="https://api.paystack.co/subscription/disable"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "code": "SUB_vsyqdmlzble3uii", 7  "token": "d7gofp6yppn3qz7" 8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Subscription disabled successfully"4}
```

## Generate Update Subscription Link

Generate a link for updating the card on a subscription

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/subscription/{code}/manage/link"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Link generated",4  "data": {5    "link": "https://paystack.com/manage/subscriptions/qlgwhpyq1ts9nsw?subscription_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWJzY3JpcHRpb25fY29kZSI6IlNVQl9xbGd3aHB5cTB0czluc3ciLCJpbnRlZ3JhdGlvbiI6MzUzNTE0LCJkb21haW4iOiJ0ZXN0IiwiZW1haWxfdG9rZW4iOiJzNXIwZjA0ODdwcnNtZWsiLCJpYXQiOjE2MzUyNTkxMzEsIm5iZiI6MTYzNTI1OTEzcjeR82XhwIjoxNjM1MzQ1NTMxfQ.FK1glvwMjHu9J8P-4n2oXPN_u_fIpQZ-F_s5x_4WLag"6  }7}
```

## Send Update Subscription Link

Email a customer a link for updating the card on their subscription

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/subscription/{code}/manage/email"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X POST
```

```
1{2  "status": true,3  "message": "Email successfully sent"4}
```