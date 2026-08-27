## Transfers Control

The Transfers Control API allows you manage settings of your transfers.

## Check Balance

Fetch the available balance on your integration

### Headers

Set value to `Bearer SECRET_KEY`

```
1#!/bin/sh2url="https://api.paystack.co/balance"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Balances retrieved",4  "data": [5    {6      "currency": "NGN",7      "balance": 17000008    }9  ]10}
```

## Fetch Balance Ledger

Fetch all pay-ins and pay-outs that occured on your integration

### Headers

Set value to `Bearer SECRET_KEY`

```
1#!/bin/sh2url="https://api.paystack.co/balance/ledger"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Balance ledger retrieved",4  "data": [5    {6      "integration": 463433,7      "domain": "test",8      "balance": 2078224968,9      "currency": "NGN",10      "difference": -50000,11      "reason": "Who dey breet?",12      "model_responsible": "Transfer",13      "model_row": 56610600,14      "id": 149411613,15      "createdAt": "2021-04-08T09:39:49.000Z",16      "updatedAt": "2021-04-08T09:39:49.000Z"17    },18    {19      "integration": 463433,20      "domain": "test",21      "balance": 2078274968,22      "currency": "NGN",23      "difference": 10000,24      "reason": "",25      "model_responsible": "Transaction",26      "model_row": 1073891448,27      "id": 149314482,28      "createdAt": "2021-04-08T00:00:11.000Z",29      "updatedAt": "2021-04-08T00:00:11.000Z"30    },31    {32      "integration": 463433,33      "domain": "test",34      "balance": 2078264968,35      "currency": "NGN",36      "difference": 500000,37      "reason": "",38      "model_responsible": "Transaction",39      "model_row": 1073278150,40      "id": 149178966,41      "createdAt": "2021-04-07T15:26:36.000Z",42      "updatedAt": "2021-04-07T15:26:36.000Z"43    },44    {45      "integration": 463433,46      "domain": "test",47      "balance": 2077764968,48      "currency": "NGN",49      "difference": 230845,50      "reason": "",51      "model_responsible": "Transaction",52      "model_row": 1073230164,53      "id": 149164577,54      "createdAt": "2021-04-07T14:56:02.000Z",55      "updatedAt": "2021-04-07T14:56:02.000Z"56    },57    {58      "integration": 463433,59      "domain": "test",60      "balance": 2077534123,61      "currency": "NGN",62      "difference": -210000,63      "reason": "",64      "model_responsible": "Refund",65      "model_row": 1600361,66      "id": 149089424,67      "createdAt": "2021-04-07T12:19:22.000Z",68      "updatedAt": "2021-04-07T12:19:22.000Z"69    }70  ],71  "meta": {72    "total": 36944,73    "skipped": 0,74    "perPage": 50,75    "page": 1,76    "pageCount": 73977  }78}
```

## Resend OTP

Generates a new OTP and sends to customer in the event they're having trouble receiving one.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Either `resend_otp` or `transfer`

```
1#!/bin/sh2url="https://api.paystack.co/transfer/resend_otp"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "transfer_code": "TRF_vsyqdmlzble3uii", 7  "reason": "resend_otp" 8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "OTP has been resent"4}
```

## Disable OTP

This is used in the event that you want to be able to complete transfers programmatically without use of OTPs. No arguments required. You will get an OTP to complete the request.

### Headers

Set value to `Bearer SECRET_KEY`

```
1#!/bin/sh2url="https://api.paystack.co/transfer/disable_otp"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5
6curl "$url" -H "$authorization" -H "$content_type" -X POST
```

```
1{2  "status": true,3  "message": "OTP has been sent to mobile number ending with 4321"4}
```

## Finalize Disable OTP

Finalize the request to disable OTP on your transfers.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

OTP sent to business phone to verify disabling OTP requirement

```
1#!/bin/sh2url="https://api.paystack.co/transfer/disable_otp_finalize"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "otp": "928783" }'6
7curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "OTP requirement for transfers has been disabled"4}
```

## Enable OTP

In the event that a customer wants to stop being able to complete transfers programmatically, this endpoint helps turn OTP requirement back on. No arguments required.

### Headers

Set value to `Bearer SECRET_KEY`

```
1#!/bin/sh2url="https://api.paystack.co/transfer/enable_otp"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5
6curl "$url" -H "$authorization" -H "$content_type" -X POST
```

```
1{2  "status": true,3  "message": "OTP requirement for transfers has been enabled"4}
```