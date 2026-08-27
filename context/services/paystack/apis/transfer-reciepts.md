## Transfers Recipients

The Transfer Recipients API allows you create and manage beneficiaries that you send money to.

Creates a new recipient. A duplicate account number will lead to the retrieval of the existing record.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Recipient Type. It could be one of: `nuban`, `ghipss`, `mobile_money` or `basa`

The recipient's name according to their account registration.

Required for all recipient types except `authorization`

Required for all recipient types except `authorization`. You can get the list of Bank Codes by calling the [List Banks](https://paystack.com/docs/api/miscellaneous#bank) endpoint.

A description for this recipient

Currency for the account receiving the transfer

An authorization code from a previous transaction

Store additional information about your recipient in a structured format, JSON

```
1#!/bin/sh2url="https://api.paystack.co/transferrecipient"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "type": "nuban",7  "name": "Tolu Robert",8  "account_number": "01000000010",9  "bank_code": "058",10  "currency": "NGN"11}'12
13curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Transfer recipient created successfully",4  "data": {5    "active": true,6    "createdAt": "2021-11-05T11:27:53.131Z",7    "currency": "NGN",8    "domain": "test",9    "id": 20317609,10    "integration": 463433,11    "name": "Tolu Robert",12    "recipient_code": "RCP_m7ljkv8leesep7p",13    "type": "nuban",14    "updatedAt": "2021-11-05T11:27:53.131Z",15    "is_deleted": false,16    "details": {17      "authorization_code": null,18      "account_number": "01000000010",19      "account_name": "Tolu Robert",20      "bank_code": "058",21      "bank_name": "Guaranty Trust Bank"22    }23  }24}
```

## Bulk Create Transfer Recipient

Create multiple transfer recipients in batches. A duplicate account number will lead to the retrieval of the existing record.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

A list of transfer recipient object. Each object should contain `type`, `name`, and `bank_code`. Any [Create Transfer Recipient](#create) param can also be passed.

```
1#!/bin/sh2url="https://api.paystack.co/transferrecipient/bulk"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "batch": [7  {8    "type":"nuban",9    "name" : "Habenero Mundane",10    "account_number": "0123456789",11    "bank_code": "033",12    "currency": "NGN"13  },14  {15    "type":"nuban",16    "name" : "Soft Merry",17    "account_number": "98765432310",18    "bank_code": "50211",19    "currency": "NGN"20  }]21}'22
23curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Recipients added successfully",4  "data": {5    "success": [6      {7        "domain": "test",8        "name": "Habenero Mundane",9        "type": "nuban",10        "description": "",11        "integration": 463433,12        "currency": "NGN",13        "metadata": null,14        "details": {15          "account_number": "0123456789",16          "account_name": null,17          "bank_code": "033",18          "bank_name": "United Bank For Africa"19        },20        "recipient_code": "RCP_wh5k8r4vzuh5c94",21        "active": true,22        "id": 10152540,23        "isDeleted": false,24        "createdAt": "2020-11-09T10:12:48.213Z",25        "updatedAt": "2020-11-09T10:12:48.213Z"26      },27      {28        "domain": "test",29        "name": "Soft Merry",30        "type": "nuban",31        "description": "",32        "integration": 463433,33        "currency": "NGN",34        "metadata": null,35        "details": {36          "account_number": "98765432310",37          "account_name": null,38          "bank_code": "50211",39          "bank_name": "Kuda Bank"40        },41        "recipient_code": "RCP_yu1kkyktoljnczg",42        "active": true,43        "id": 10152541,44        "isDeleted": false,45        "createdAt": "2020-11-09T10:12:48.213Z",46        "updatedAt": "2020-11-09T10:12:48.213Z"47      }48    ],49    "errors": []50  }51}
```

## List Transfer Recipients

List transfer recipients available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing transfer recipients e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing transfer recipients e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/transferrecipient"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Recipients retrieved",4  "data": [5    {6      "domain": "test",7      "type": "nuban",8      "currency": "NGN",9      "name": "Flesh",10      "details": {11        "account_number": "01000000000",12        "account_name": null,13        "bank_code": "044",14        "bank_name": "Access Bank"15      },16      "metadata": {17        "job": "Eater"18      },19      "recipient_code": "RCP_2x5j67tnnw1t98k",20      "active": true,21      "id": 28,22      "createdAt": "2017-02-02T19:39:04.000Z",23      "updatedAt": "2017-02-02T19:39:04.000Z"24    },25    {26      "integration": 100073,27      "domain": "test",28      "type": "nuban",29      "currency": "NGN",30      "name": "Flesh",31      "details": {32        "account_number": "0100000010",33        "account_name": null,34        "bank_code": "044",35        "bank_name": "Access Bank"36      },37      "metadata": {},38      "recipient_code": "RCP_1i2k27vk4suemug",39      "active": true,40      "id": 27,41      "createdAt": "2017-02-02T19:35:33.000Z",42      "updatedAt": "2017-02-02T19:35:33.000Z"43    }44  ],45  "meta": {46    "total": 2,47    "skipped": 0,48    "perPage": 50,49    "page": 1,50    "pageCount": 151  }52}
```

## Fetch Transfer Recipient

Fetch the details of a transfer recipient

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

An ID or code for the recipient whose details you want to receive.

```
1#!/bin/sh2url="https://api.paystack.co/transferrecipient/{id_or_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Recipient retrieved",4  "data": {5    "domain": "test",6    "type": "nuban",7    "currency": "NGN",8    "name": "Flesh",9    "details": {10      "account_number": "01000000000",11      "account_name": null,12      "bank_code": "044",13      "bank_name": "Access Bank"14    },15    "metadata": {16      "job": "Eater"17    },18    "recipient_code": "RCP_2x5j67tnnw1t98k",19    "active": true,20    "id": 28,21    "createdAt": "2017-02-02T19:39:04.000Z",22    "updatedAt": "2017-02-02T19:39:04.000Z"23  }24}
```

## Update Transfer Recipient

Update transfer recipients available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

Transfer Recipient's ID or code

### Body Parameters

Email address of the recipient

```
1#!/bin/sh2url="https://api.paystack.co/transferrecipient/{id_or_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "name": "Rick Sanchez" 7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Recipient updated",4  "data": {5    "type": "nuban",6    "name": "Rick Sanchez",7    "metadata": {8      "job": "Flesh Eater",9      "retired": true10    },11    "domain": "test",12    "details": {13      "account_number": "01000000010",14      "account_name": null,15      "bank_code": "044",16      "bank_name": "Access Bank"17    },18    "currency": "NGN",19    "recipient_code": "RCP_1i2k27vk4suemug",20    "active": true,21    "id": 27,22    "createdAt": "2017-02-02T19:35:33.686Z",23    "updatedAt": "2017-02-02T19:35:33.686Z"24  }25}
```

## Delete Transfer Recipient

Delete a transfer recipient (sets the transfer recipient to inactive)

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

An ID or code for the recipient who you want to delete.

```
1#!/bin/sh2url="https://api.paystack.co/transferrecipient/{id_or_code}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X DELETE
```

```
1{2  "status": true,3  "message": "Transfer recipient set as inactive"4}
```