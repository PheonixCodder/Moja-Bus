## Bulk Charges

The Bulk Charges API allows you create and manage multiple recurring payments from your customers.

## Initiate Bulk Charge

Send an array of objects with authorization codes and amount, using the [supported currency](https://paystack.com/docs/api/#supported-currency) format, so we can process transactions as a batch.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

A list of charge object. Each object consists of an `authorization`, `amount` and `reference`

```
1#!/bin/sh2url="https://api.paystack.co/bulkcharge"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  [7    {"authorization": "AUTH_ncx8hews93", "amount": 2500, "reference": "dam1266638dhhd"}, 8    {"authorization": "AUTH_xfuz7dy4b9", "amount": 1500, "reference": "dam1266638dhhe"}9  ]10}'11
12curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charges have been queued",4  "data": {5    "batch_code": "BCH_rrsbgwb4ivgzst1",6    "reference": "bulkcharge-1663150565684-p18nyoa68a",7    "id": 66608171,8    "integration": 463433,9    "domain": "test",10    "status": "active",11    "total_charges": 2,12    "pending_charges": 2,13    "createdAt": "2022-09-14T10:16:05.000Z",14    "updatedAt": "2022-09-14T10:16:05.000Z"15  }16}
```

## List Bulk Charge Batches

This lists all bulk charge batches created by the integration. Statuses can be `active`, `paused`, or `complete`

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what transfer you want to page. If not specified, we use a default value of 1.

A timestamp from which to start listing batches e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing batches e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/bulkcharge"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Bulk charges retrieved",4  "data": [5    {6      "domain": "test",7      "batch_code": "BCH_1nV4L1D7cayggh",8      "status": "complete",9      "id": 1733,10      "createdAt": "2017-02-04T05:44:19.000Z",11      "updatedAt": "2017-02-04T05:45:02.000Z"12    }13  ],14  "meta": {15    "total": 1,16    "skipped": 0,17    "perPage": 50,18    "page": 1,19    "pageCount": 120  }21}
```

## Fetch Bulk Charge Batch

This endpoint retrieves a specific batch code. It also returns useful information on its progress by way of the `total_charges` and `pending_charges` attributes.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

An ID or code for the charge whose batches you want to retrieve.

```
1#!/bin/sh2url="https://api.paystack.co/bulkcharge/{id_or_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Bulk charge retrieved",4  "data": {5    "domain": "test",6    "batch_code": "BCH_180tl7oq7cayggh",7    "status": "complete",8    "id": 17,9    "total_charges": 0,10    "pending_charges": 0,11    "createdAt": "2017-02-04T05:44:19.000Z",12    "updatedAt": "2017-02-04T05:45:02.000Z"13  }14}
```

## Fetch Charges in a Batch

This endpoint retrieves the charges associated with a specified batch code. Pagination parameters are available. You can also filter by status. Charge statuses can be `pending`, `success` or `failed`.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

An ID or code for the batch whose charges you want to retrieve.

### Query Parameters

Either one of these values: `pending`, `success` or `failed`

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what transfer you want to page. If not specified, we use a default value of 1.

A timestamp from which to start listing charges e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing charges e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/bulkcharge/{id_or_code}/charges"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Bulk charge items retrieved",4  "data": [5    {6      "integration": 100073,7      "bulkcharge": 18,8      "customer": {9        "id": 181336,10        "first_name": null,11        "last_name": null,12        "email": "test@again.com",13        "customer_code": "CUS_dw5posshfd1i5uj",14        "phone": null,15        "metadata": null,16        "risk_action": "default"17      },18      "authorization": {19        "authorization_code": "AUTH_jh3cfpca",20        "bin": "412345",21        "last4": "1381",22        "exp_month": "08",23        "exp_year": "2088",24        "channel": "card",25        "card_type": "visa visa",26        "bank": "TEST BANK",27        "country_code": "NG",28        "brand": "visa",29        "reusable": true,30        "account_name": "BoJack Horseman"31      },32      "transaction": {33        "id": 718835,34        "domain": "test",35        "status": "success",36        "reference": "2mr588n0ik9enja",37        "amount": 20500,38        "message": null,39        "gateway_response": "Successful",40        "paid_at": "2017-02-04T06:05:02.000Z",41        "created_at": "2017-02-04T06:05:02.000Z",42        "channel": "card",43        "currency": "NGN",44        "ip_address": null,45        "metadata": "",46        "log": null,47        "fees": null,48        "fees_split": null,49        "customer": {},50        "authorization": {},51        "plan": {},52        "subaccount": {},53        "paidAt": "2017-02-04T06:05:02.000Z",54        "createdAt": "2017-02-04T06:05:02.000Z"55      },56      "domain": "test",57      "amount": 20500,58      "currency": "NGN",59      "status": "success",60      "id": 15,61      "createdAt": "2017-02-04T06:04:26.000Z",62      "updatedAt": "2017-02-04T06:05:03.000Z"63    },64    {65      "integration": 100073,66      "bulkcharge": 18,67      "customer": {68        "id": 181336,69        "first_name": null,70        "last_name": null,71        "email": "duummy@email.com",72        "customer_code": "CUS_dw5posshfd1i5uj",73        "phone": null,74        "metadata": null,75        "risk_action": "default"76      },77      "authorization": {78        "authorization_code": "AUTH_qdyfjbl3",79        "bin": "412345",80        "last4": "1381",81        "exp_month": "08",82        "exp_year": "2018",83        "channel": "card",84        "card_type": "visa visa",85        "bank": "TEST BANK",86        "country_code": "NG",87        "brand": "visa",88        "reusable": true,89        "account_name": "BoJack Horseman"90      },91      "transaction": {92        "id": 718836,93        "domain": "test",94        "status": "success",95        "reference": "5xkmvfe2h4065zl",96        "amount": 11500,97        "message": null,98        "gateway_response": "Successful",99        "paid_at": "2017-02-04T06:05:02.000Z",100        "created_at": "2017-02-04T06:05:02.000Z",101        "channel": "card",102        "currency": "NGN",103        "ip_address": null,104        "metadata": "",105        "log": null,106        "fees": null,107        "fees_split": null,108        "customer": {},109        "authorization": {},110        "plan": {},111        "subaccount": {},112        "paidAt": "2017-02-04T06:05:02.000Z",113        "createdAt": "2017-02-04T06:05:02.000Z"114      },115      "domain": "test",116      "amount": 11500,117      "currency": "NGN",118      "status": "success",119      "id": 16,120      "createdAt": "2017-02-04T06:04:26.000Z",121      "updatedAt": "2017-02-04T06:05:03.000Z"122    }123  ],124  "meta": {125    "total": 2,126    "skipped": 0,127    "perPage": 50,128    "page": 1,129    "pageCount": 1130  }131}
```

## Pause Bulk Charge Batch

Use this endpoint to pause processing a batch

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The batch code for the bulk charge you want to pause

```
1#!/bin/sh2url="https://api.paystack.co/bulkcharge/pause/{batch_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Bulk charge batch has been paused"4}
```

## Resume Bulk Charge Batch

Use this endpoint to resume processing a batch

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The batch code for the bulk charge you want to resume

```
1#!/bin/sh2url="https://api.paystack.co/bulkcharge/resume/{batch_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Bulk charge batch has been resumed"4}
```