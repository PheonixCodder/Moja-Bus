## Refunds

The Refunds API allows you create and manage transaction refunds.

## Create Refund

Initiate a refund on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Transaction reference or id

Amount, in the subunit of the [supported currency](https://paystack.com/docs/api/#supported-currency), to be refunded to the customer. Amount is optional(defaults to original transaction amount) and cannot be more than the original transaction amount.

```
1#!/bin/sh2url="https://api.paystack.co/refund"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "transaction": 1641 }'6
7curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Refund has been queued for processing",4  "data": {5    "transaction": {6      "id": 1004723697,7      "domain": "live",8      "reference": "T685312322670591",9      "amount": 10000,10      "paid_at": "2021-08-20T18:34:11.000Z",11      "channel": "apple_pay",12      "currency": "NGN",13      "authorization": {14        "exp_month": null,15        "exp_year": null,16        "account_name": null17      },18      "customer": {19        "international_format_phone": null20      },21      "plan": {},22      "subaccount": {23        "currency": null24      },25      "split": {},26      "order_id": null,27      "paidAt": "2021-08-20T18:34:11.000Z",28      "pos_transaction_data": null,29      "source": null,30      "fees_breakdown": null31    },32    "integration": 412829,33    "deducted_amount": 0,34    "channel": null,35    "merchant_note": "Refund for transaction T685312322670591 by test@me.com",36    "customer_note": "Refund for transaction T685312322670591",37    "status": "pending",38    "refunded_by": "test@me.com",39    "expected_at": "2021-12-16T09:21:17.016Z",40    "currency": "NGN",41    "domain": "live",42    "amount": 10000,43    "fully_deducted": false,44    "id": 3018284,45    "createdAt": "2021-12-07T09:21:17.122Z",46    "updatedAt": "2021-12-07T09:21:17.122Z"47  }48}
```

## Retry Refund

Retry a refund with a `needs-attention` status by providing the bank account details of a customer.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

The ID of the previously initiated refund

### Body Parameters

An object that contains the customer’s account details for refund

The currency of the customer's bank account. It should be the same as the currency the payment was made

The customer's account number

The ID representing the customer's bank. You can get the list of bank IDs by calling the [List Banks](https://paystack.com/docs/api/miscellaneous#bank) endpoint.

```
1#!/bin/sh2url="https://api.paystack.co/refund/retry_with_customer_details/{id}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{6  "refund_account_details": {7    "currency": "NGN",8    "account_number": "1234567890",9    "bank_id": "9"10  }11}'12
13curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Refund retried and has been queued for processing",4  "data": {5    "integration": 123456,6    "transaction": 3298598423,7    "dispute": null,8    "settlement": null,9    "id": 1234567,10    "domain": "live",11    "currency": "NGN",12    "amount": 20000,13    "status": "processing",14    "refunded_at": null,15    "expected_at": "2025-10-13T16:02:18.000Z",16    "channel": "isw_3ds",17    "refunded_by": "paystack@email.com",18    "customer_note": "Refund for transaction T708775813895475",19    "merchant_note": "Refund for transaction T708775813895475 by paystack@email.com",20    "deducted_amount": 20000,21    "fully_deducted": true,22    "bank_reference": null,23    "reason": "PROCESSING",24    "customer": null,25    "initiated_by": "paystack@email.com",26    "reversed_at": null,27    "session_id": null28  }29}
```

## List Refunds

List refunds available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

The transaction ID of the refunded transaction

A timestamp from which to start listing refund e.g. `2016-09-21`

A timestamp at which to stop listing refund e.g. `2016-09-21`

Specify how many records you want to retrieve per page. If not specified we use a default value of 50.

Specify exactly what refund you want to page. If not specified we use a default value of 1.

```
1#!/bin/sh2url="https://api.paystack.co/refund"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Refunds retrieved",4  "data": [5    {6      "id": 1,7      "integration": 100982,8      "domain": "live",9      "transaction": 1641,10      "dispute": 20,11      "amount": 500000,12      "deducted_amount": 500000,13      "currency": "NGN",14      "channel": "migs",15      "fully_deducted": 1,16      "refunded_by": "customer@gmail.com",17      "refunded_at": "2018-01-12T10:54:47.000Z",18      "expected_at": "2017-10-01T21:10:59.000Z",19      "settlement": null,20      "customer_note": "xxx",21      "merchant_note": "xxx",22      "created_at": "2017-09-24T21:10:59.000Z",23      "updated_at": "2018-01-18T11:59:56.000Z",24      "status": "processed"25    },26    {27      "id": 2,28      "integration": 100982,29      "domain": "test",30      "transaction": 323896,31      "dispute": 45,32      "amount": 500000,33      "deducted_amount": null,34      "currency": "NGN",35      "channel": "migs",36      "fully_deducted": null,37      "refunded_by": "customer@gmail.com",38      "refunded_at": "2017-09-24T21:11:53.000Z",39      "expected_at": "2017-10-01T21:11:53.000Z",40      "settlement": null,41      "customer_note": "xxx",42      "merchant_note": "xxx",43      "created_at": "2017-09-24T21:11:53.000Z",44      "updated_at": "2017-09-24T21:11:53.000Z",45      "status": "pending"46    }47  ]48}
```

## Fetch Refund

Get details of a refund on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The ID of the initiated refund

```
1#!/bin/sh2url="https://api.paystack.co/refund/:id"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Refund retrieved",4  "data": {5    "integration": 100982,6    "transaction": 1641,7    "dispute": null,8    "settlement": null,9    "domain": "live",10    "amount": 500000,11    "deducted_amount": 500000,12    "fully_deducted": true,13    "currency": "NGN",14    "channel": "migs",15    "status": "processed",16    "refunded_by": "eseyinwale@gmail.com",17    "refunded_at": "2018-01-12T10:54:47.000Z",18    "expected_at": "2017-10-01T21:10:59.000Z",19    "customer_note": "xxx",20    "merchant_note": "xxx",21    "id": 1,22    "createdAt": "2017-09-24T21:10:59.000Z",23    "updatedAt": "2018-01-18T11:59:56.000Z"24  }25}
```