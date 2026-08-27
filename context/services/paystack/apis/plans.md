## Plans

The Plans API allows you create and manage installment payment options on your integration.

## Create Plan

Create a plan on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Interval in words. Valid intervals are: `daily`, `weekly`, `monthly`,`quarterly`, `biannually` (every 6 months), `annually`.

A description for this plan

Set to false if you don't want invoices to be sent to your customers

Set to false if you don't want text messages to be sent to your customers

Number of invoices to raise during subscription to this plan. Can be overridden by specifying an `invoice_limit` while subscribing.

```
1#!/bin/sh2url="https://api.paystack.co/plan"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "name": "Monthly retainer", 7  "interval": "monthly", 8  "amount": "500000" 9}'10
11curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Plan created",4  "data": {5    "name": "Monthly retainer",6    "amount": 500000,7    "interval": "monthly",8    "integration": 100032,9    "domain": "test",10    "plan_code": "PLN_gx2wn530m0i3w3m",11    "send_invoices": true,12    "send_sms": true,13    "hosted_page": false,14    "currency": "NGN",15    "id": 28,16    "createdAt": "2016-03-29T22:42:50.811Z",17    "updatedAt": "2016-03-29T22:42:50.811Z"18  }19}
```

## List Plans

List plans available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

Filter list by plans with specified status

Filter list by plans with specified interval

```
1#!/bin/sh2url="https://api.paystack.co/plan"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Plans retrieved",4  "data": [5    {6      "subscriptions": [7        {8          "customer": 63,9          "plan": 27,10          "integration": 100032,11          "domain": "test",12          "start": 1458505748,13          "status": "complete",14          "quantity": 1,15          "amount": 100000,16          "subscription_code": "SUB_birvokwpp0sftun",17          "email_token": "9y62mxp4uh25das",18          "authorization": {19            "authorization_code": "AUTH_6tmt288t0o",20            "bin": "408408",21            "last4": "4081",22            "exp_month": "12",23            "exp_year": "2020",24            "channel": "card",25            "card_type": "visa visa",26            "bank": "TEST BANK",27            "country_code": "NG",28            "brand": "visa",29            "reusable": true,30            "signature": "SIG_uSYN4fv1adlAuoij8QXh",31            "account_name": "BoJack Horseman"32          },33          "easy_cron_id": null,34          "cron_expression": "0 0 * * 0",35          "next_payment_date": "2016-03-27T07:00:00.000Z",36          "open_invoice": null,37          "id": 8,38          "createdAt": "2016-03-20T20:29:08.000Z",39          "updatedAt": "2016-03-22T16:23:52.000Z"40        }41      ],42      "integration": 100032,43      "domain": "test",44      "name": "Satin Flower",45      "plan_code": "PLN_lkozbpsoyd4je9t",46      "description": null,47      "amount": 100000,48      "interval": "weekly",49      "send_invoices": true,50      "send_sms": true,51      "hosted_page": false,52      "hosted_page_url": null,53      "hosted_page_summary": null,54      "currency": "NGN",55      "id": 27,56      "createdAt": "2016-03-21T02:44:14.000Z",57      "updatedAt": "2016-03-21T02:44:14.000Z"58    },59    {60      "subscriptions": [],61      "integration": 100032,62      "domain": "test",63      "name": "Monthly retainer",64      "plan_code": "PLN_gx2wn530m0i3w3m",65      "description": null,66      "amount": 50000,67      "interval": "monthly",68      "send_invoices": true,69      "send_sms": true,70      "hosted_page": false,71      "hosted_page_url": null,72      "hosted_page_summary": null,73      "currency": "NGN",74      "id": 28,75      "createdAt": "2016-03-29T22:42:50.000Z",76      "updatedAt": "2016-03-29T22:42:50.000Z"77    }78  ],79  "meta": {80    "total": 2,81    "skipped": 0,82    "perPage": 50,83    "page": 1,84    "pageCount": 185  }86}
```

## Fetch Plan

Get details of a plan on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The plan `ID` or `code` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/plan/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Plan retrieved",4  "data": {5    "subscriptions": [],6    "integration": 100032,7    "domain": "test",8    "name": "Monthly retainer",9    "plan_code": "PLN_gx2wn530m0i3w3m",10    "description": null,11    "amount": 50000,12    "interval": "monthly",13    "send_invoices": true,14    "send_sms": true,15    "hosted_page": false,16    "hosted_page_url": null,17    "hosted_page_summary": null,18    "currency": "NGN",19    "id": 28,20    "createdAt": "2016-03-29T22:42:50.000Z",21    "updatedAt": "2016-03-29T22:42:50.000Z"22  }23}
```

## Update Plan

Update a plan details on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

Interval in words. Valid intervals are `hourly`, `daily`, `weekly`, `monthly`,`quarterly`, `biannually` (every 6 months), `annually`.

A description for this plan

Set to false if you don't want invoices to be sent to your customers

Set to false if you don't want text messages to be sent to your customers

Number of invoices to raise during subscription to this plan. Can be overridden by specifying an `invoice_limit` while subscribing.

Set to `true` if you want the existing subscriptions to use the new changes. Set to `false` and only new subscriptions will be changed. Defaults to true when not set.

```
1#!/bin/sh2url="https://api.paystack.co/plan/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6    "name": "Monthly retainer (renamed)" 7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Plan updated. 1 subscription(s) affected"4}
```