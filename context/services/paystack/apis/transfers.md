## Transfers

The Transfers API allows you automate sending money to your customers.

## Initiate Transfer

Send money to your customers.

Status of transfer object returned will be `pending` if OTP is disabled. In the event that an OTP is required, status will read `otp`.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Where should we transfer from? Only `balance` for now

Amount to transfer in **kobo** if currency is `NGN` and **pesewas** if currency is `GHS`.

Code for transfer recipient

A unique identifier containing lowercase letters `(a-z)`, digits `(0-9)` and these symbols: dash `(-)`, underscore`(_)`.

The reason for the transfer. This would also show up in the narration of the customer's credit notification

Specify the currency of the transfer. Defaults to NGN

A unique identifier required in Kenya for MPESA Paybill and Till transfers

```
1#!/bin/sh2url="https://api.paystack.co/transfer"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "source": "balance",7  "amount": 100000,8  "recipient": "RCP_gd9vgag7n5lr5ix",9  "reference": "acv_9ee55786-2323-4760-98e2-6380c9cb3f68",10  "reason": "Bonus for the week"11}'12
13curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Transfer has been queued",4  "data": {5    "transfersessionid": [],6    "transfertrials": [],7    "domain": "test",8    "amount": 100000,9    "currency": "NGN",10    "reference": "acv_9ee55786-2323-4760-98e2-6380c9cb3f68",11    "source": "balance",12    "source_details": null,13    "reason": "Bonus for the week",14    "status": "success",15    "failures": null,16    "transfer_code": "TRF_v5tip3zx8nna9o78",17    "titan_code": null,18    "transferred_at": null,19    "id": 860703114,20    "integration": 463433,21    "request": 1068439313,22    "recipient": 56824902,23    "createdAt": "2025-08-04T10:32:40.000Z",24    "updatedAt": "2025-08-04T10:32:40.000Z"25  }26}
```

## Finalize Transfer

Finalize an initiated transfer

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

The transfer code you want to finalize

OTP sent to business phone to verify transfer

```
1#!/bin/sh2url="https://api.paystack.co/transfer/finalize_transfer"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "transfer_code": "TRF_vsyqdmlzble3uii", 7  "otp": "928783"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Transfer has been queued",4  "data": {5    "domain": "test",6    "amount": 1000000,7    "currency": "NGN",8    "reference": "n7ll9pzl6b",9    "source": "balance",10    "source_details": null,11    "reason": "E go better for you",12    "status": "success",13    "failures": null,14    "transfer_code": "TRF_zuirlnr9qblgfko",15    "titan_code": null,16    "transferred_at": null,17    "id": 529410,18    "integration": 123460,19    "recipient": 225204,20    "createdAt": "2018-08-02T10:02:55.000Z",21    "updatedAt": "2018-08-02T10:12:05.000Z"22  }23}
```

## Initiate Bulk Transfer

Batch multiple transfers in a single request.

You need to disable the Transfers OTP requirement to use this endpoint.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Where should we transfer from? Only `balance` for now

A list of transfer object.

Amount to transfer in **kobo** if currency is `NGN` and **pesewas** if currency is `GHS`.

Code for transfer recipient

A unique identifier containing lowercase letters `(a-z)`, digits `(0-9)` and these symbols: dash `(-)`, underscore`(_)`.

The reason for the transfer. This also shows up in the narration of the customer's credit notification.

```
1#!/bin/sh2url="https://api.paystack.co/transfer/bulk"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{6  "currency": "NGN",7  "source": "balance",8  "transfers": [9    {10      "amount": 20000,11      "reference": "acv_2627bbfe-1a2a-4a1a-8d0e-9d2ee6c31496",12      "reason": "Bonus for the week",13      "recipient": "RCP_gd9vgag7n5lr5ix"14    },15    {16      "amount": 35000,17      "reference": "acv_1bd0c1f8-78c2-463b-8bd4-ed9eeb36be50",18      "reason": "Bonus for the week",19      "recipient": "RCP_zpk2tgagu6lgb4g"20    },21    {22      "amount": 15000,23      "reference": "acv_11bebfc3-18b3-40aa-a4df-c55068c93457",24      "reason": "Bonus for the week",25      "recipient": "RCP_dfznnod8rwxlwgn"26    }27  ]28}'29
30curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "3 transfers queued.",4  "data": [5    {6      "reference": "acv_2627bbfe-1a2a-4a1a-8d0e-9d2ee6c31496",7      "recipient": "RCP_gd9vgag7n5lr5ix",8      "amount": 20000,9      "transfer_code": "TRF_o0mv5dc2lv4t2wdb",10      "currency": "NGN",11      "status": "success"12    },13    {14      "reference": "acv_1bd0c1f8-78c2-463b-8bd4-ed9eeb36be50",15      "recipient": "RCP_zpk2tgagu6lgb4g",16      "amount": 35000,17      "transfer_code": "TRF_tlvxomz43gjso2py",18      "currency": "NGN",19      "status": "success"20    },21    {22      "reference": "acv_11bebfc3-18b3-40aa-a4df-c55068c93457",23      "recipient": "RCP_dfznnod8rwxlwgn",24      "amount": 15000,25      "transfer_code": "TRF_yt2y2gcd3dmli8av",26      "currency": "NGN",27      "status": "success"28    }29  ]30}
```

## List Transfers

List the transfers made on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specify we use a default value of 50.

Specify exactly what transfer you want to page. If not specify we use a default value of 1.

Filter by the recipient ID

A timestamp from which to start listing transfer e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing transfer e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/transfer"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Transfers retrieved",4  "data": [5    {6      "integration": 100073,7      "recipient": {8        "domain": "test",9        "type": "nuban",10        "currency": "NGN",11        "name": "Flesh",12        "details": {13          "account_number": "olounje",14          "account_name": null,15          "bank_code": "044",16          "bank_name": "Access Bank"17        },18        "description": "Eater",19        "metadata": null,20        "recipient_code": "RCP_2x5j67tnnw1t98k",21        "active": true,22        "id": 28,23        "integration": 100073,24        "createdAt": "2017-02-02T19:39:04.000Z",25        "updatedAt": "2017-02-02T19:39:04.000Z"26      },27      "domain": "test",28      "amount": 4400,29      "currency": "NGN",30      "source": "balance",31      "source_details": null,32      "reason": "Eater",33      "status": "otp",34      "failures": null,35      "transfer_code": "TRF_1ptvuv321ahaa7q",36      "id": 14,37      "createdAt": "2017-02-03T17:21:54.000Z",38      "updatedAt": "2017-02-03T17:21:54.000Z"39    },40    {41      "integration": 100073,42      "recipient": {43        "domain": "test",44        "type": "nuban",45        "currency": "USD",46        "name": "FleshUSD",47        "details": {48          "account_number": "1111111111",49          "account_name": null,50          "bank_code": "044",51          "bank_name": "Access Bank"52        },53        "description": "EaterUSD",54        "metadata": null,55        "recipient_code": "RCP_bi84k5gguakuqmg",56        "active": true,57        "id": 22,58        "integration": 100073,59        "createdAt": "2017-01-23T16:52:48.000Z",60        "updatedAt": "2017-01-23T16:52:48.000Z"61      },62      "domain": "test",63      "amount": 3300,64      "currency": "NGN",65      "source": "balance",66      "source_details": null,67      "reason": "I love you",68      "status": "otp",69      "failures": null,70      "transfer_code": "TRF_5pr8ypzb0htx0cn",71      "id": 13,72      "createdAt": "2017-01-23T16:55:59.000Z",73      "updatedAt": "2017-01-23T16:55:59.000Z"74    }75  ],76  "meta": {77    "total": 2,78    "skipped": 0,79    "perPage": 50,80    "page": 1,81    "pageCount": 182  }83}
```

## Fetch Transfer

Get details of a transfer on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The transfer `ID` or `code` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/transfer/{id_or_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Transfer retrieved",4  "data": {5    "amount": 20000,6    "createdAt": "2024-02-01T08:32:21.000Z",7    "currency": "NGN",8    "domain": "test",9    "failures": null,10    "id": 451930323,11    "integration": 463433,12    "reason": "Life go better for you",13    "reference": "ge-bzrf8u8k2pygxrnqf",14    "source": "balance",15    "source_details": null,16    "status": "success",17    "titan_code": null,18    "transfer_code": "TRF_fpmd0l8uta8upow7",19    "request": 502643104,20    "transferred_at": null,21    "updatedAt": "2024-02-01T08:34:07.000Z",22    "recipient": {23      "active": true,24      "createdAt": "2021-10-21T11:08:04.000Z",25      "currency": "NGN",26      "description": null,27      "domain": "test",28      "email": "jake@jill.com",29      "id": 19643784,30      "integration": 463433,31      "metadata": {32        "custom_fields": [33          {34            "display_name": "Branch Name",35            "variable_name": "branchName",36            "value": "funny place, Alabama"37          },38          {39            "display_name": "Branch ID",40            "variable_name": "branchID",41            "value": "123"42          }43        ]44      },45      "name": "Abbey Baker",46      "recipient_code": "RCP_rjs1szi4ax5hoeo",47      "type": "nuban",48      "updatedAt": "2023-03-29T08:39:39.000Z",49      "is_deleted": false,50      "isDeleted": false,51      "details": {52        "authorization_code": null,53        "account_number": "0123456789",54        "account_name": "Abbey Baker",55        "bank_code": "058",56        "bank_name": "Guaranty Trust Bank"57      }58    },59    "session": {60      "provider": null,61      "id": null62    },63    "fee_charged": 0,64    "fees_breakdown": null,65    "gateway_response": null66  }67}
```

## Verify Transfer

Verify the status of a transfer on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/transfer/verify/{reference}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Transfer retrieved",4  "data": {5    "amount": 100000,6    "createdAt": "2025-08-04T09:59:19.000Z",7    "currency": "NGN",8    "domain": "test",9    "failures": null,10    "id": 860670817,11    "integration": 463433,12    "reason": "Bonus for the week",13    "reference": "acv_9ee55786-2323-4760-98e2-6380c9cb3f67",14    "source": "balance",15    "source_details": null,16    "status": "success",17    "titan_code": null,18    "transfer_code": "TRF_8opchtrhtjlfz90n",19    "request": 1068403325,20    "transferred_at": null,21    "updatedAt": "2025-08-04T09:59:19.000Z",22    "recipient": {23      "active": true,24      "createdAt": "2023-07-11T15:42:27.000Z",25      "currency": "NGN",26      "description": "",27      "domain": "test",28      "email": null,29      "id": 56824902,30      "integration": 463433,31      "metadata": null,32      "name": "Jekanmo Padie",33      "recipient_code": "RCP_gd9vgag7n5lr5ix",34      "type": "nuban",35      "updatedAt": "2023-07-11T15:42:27.000Z",36      "is_deleted": false,37      "isDeleted": false,38      "details": {39        "authorization_code": null,40        "account_number": "9876543210",41        "account_name": null,42        "bank_code": "044",43        "bank_name": "Access Bank"44      }45    },46    "session": {47      "provider": null,48      "id": null49    },50    "fee_charged": 1000,51    "fees_breakdown": null,52    "gateway_response": null53  }54}
```