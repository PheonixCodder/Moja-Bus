## Transaction Splits

The Transaction Splits API enables merchants split the settlement for a transaction across their payout account, and one or more subaccounts.

## Create Split

Create a split payment on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Name of the transaction split

The type of transaction split you want to create. You can use one of the following: percentage | flat

A list of object containing subaccount code and number of shares: `[{subaccount: ‘ACT_xxxxxxxxxx’, share: xxx},{...}]`

Any of subaccount | account | all-proportional | all

```
1#!/bin/sh2url="https://api.paystack.co/split"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "name":"Halfsies", 7  "type":"percentage", 8  "currency": "NGN",9  "subaccounts":[{10    "subaccount": "ACCT_6uujpqtzmnufzkw",11    "share": 5012  }]13}'14
15curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Split created",4  "data": {5    "id": 2703655,6    "name": "Halfsies",7    "type": "percentage",8    "currency": "NGN",9    "integration": 463433,10    "domain": "test",11    "split_code": "SPL_RcScyW5jp2",12    "active": true,13    "bearer_type": "all",14    "createdAt": "2024-08-26T11:38:47.506Z",15    "updatedAt": "2024-08-26T11:38:47.506Z",16    "is_dynamic": false,17    "subaccounts": [18      {19        "subaccount": {20          "id": 1151727,21          "subaccount_code": "ACCT_6uujpqtzmnufzkw",22          "business_name": "Oasis Global",23          "description": "Oasis Global",24          "primary_contact_name": null,25          "primary_contact_email": null,26          "primary_contact_phone": null,27          "metadata": null,28          "settlement_bank": "Guaranty Trust Bank",29          "currency": "NGN",30          "account_number": "0123456047"31        },32        "share": 5033      }34    ],35    "total_subaccounts": 136  }37}
```

## List Split

List the transaction splits available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Sort by name, defaults to createdAt date

Number of splits per page. If not specified, we use a default value of 50.

Page number to view. If not specified, we use a default value of 1.

A timestamp from which to start listing splits e.g. `2019-09-24T00:00:05.000Z`, `2019-09-21`

A timestamp at which to stop listing splits e.g. `2019-09-24T00:00:05.000Z`, `2019-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/split"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Split retrieved",4  "data": [5    {6      "id": 2703655,7      "name": "Halfsies",8      "type": "percentage",9      "currency": "NGN",10      "integration": 463433,11      "domain": "test",12      "split_code": "SPL_RcScyW5jp2",13      "active": true,14      "bearer_type": "all",15      "bearer_subaccount": null,16      "createdAt": "2024-08-26T11:38:47.000Z",17      "updatedAt": "2024-08-26T11:38:47.000Z",18      "is_dynamic": false,19      "subaccounts": [20        {21          "subaccount": {22            "id": 1151727,23            "subaccount_code": "ACCT_6uujpqtzmnufzkw",24            "business_name": "Oasis Global",25            "description": "Oasis Global",26            "primary_contact_name": null,27            "primary_contact_email": null,28            "primary_contact_phone": null,29            "metadata": null,30            "settlement_bank": "Guaranty Trust Bank",31            "currency": "NGN",32            "account_number": "0123456047"33          },34          "share": 5035        }36      ],37      "total_subaccounts": 138    }39  ],40  "meta": {41    "total": 98,42    "skipped": 0,43    "perPage": 50,44    "page": 1,45    "pageCount": 246  }47}
```

## Fetch Split

Get details of a split on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/split/{id}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Split retrieved",4  "data": {5    "id": 2703655,6    "name": "Halfsies",7    "type": "percentage",8    "currency": "NGN",9    "integration": 463433,10    "domain": "test",11    "split_code": "SPL_RcScyW5jp2",12    "active": true,13    "bearer_type": "all",14    "bearer_subaccount": null,15    "createdAt": "2024-08-26T11:38:47.000Z",16    "updatedAt": "2024-08-26T11:38:47.000Z",17    "is_dynamic": false,18    "subaccounts": [19      {20        "subaccount": {21          "id": 1151727,22          "subaccount_code": "ACCT_6uujpqtzmnufzkw",23          "business_name": "Oasis Global",24          "description": "Oasis Global",25          "primary_contact_name": null,26          "primary_contact_email": null,27          "primary_contact_phone": null,28          "metadata": null,29          "settlement_bank": "Guaranty Trust Bank",30          "currency": "NGN",31          "account_number": "0123456047"32        },33        "share": 5034      }35    ],36    "total_subaccounts": 137  }38}
```

## Update Split

Update a transaction split details on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

Name of the transaction split

Any of the following values: subaccount | account | all-proportional | all

Subaccount code of a subaccount in the split group. This should be specified only if the `bearer_type` is `subaccount`

```
1#!/bin/sh2url="https://api.paystack.co/split/{id}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "bearer_type": "all-proportional"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Split group updated",4  "data": {5    "id": 2703655,6    "name": "Halfsies",7    "type": "percentage",8    "currency": "NGN",9    "integration": 463433,10    "domain": "test",11    "split_code": "SPL_RcScyW5jp2",12    "active": true,13    "bearer_type": "all-proportional",14    "bearer_subaccount": null,15    "createdAt": "2024-08-26T11:38:47.000Z",16    "updatedAt": "2024-08-26T11:50:47.000Z",17    "is_dynamic": false,18    "subaccounts": [19      {20        "subaccount": {21          "id": 1151727,22          "subaccount_code": "ACCT_6uujpqtzmnufzkw",23          "business_name": "Oasis Global",24          "description": "Oasis Global",25          "primary_contact_name": null,26          "primary_contact_email": null,27          "primary_contact_phone": null,28          "metadata": null,29          "settlement_bank": "Guaranty Trust Bank",30          "currency": "NGN",31          "account_number": "0123456047"32        },33        "share": 5034      }35    ],36    "total_subaccounts": 137  }38}
```

## Add/Update Subaccount Split

Add a Subaccount to a Transaction Split, or update the share of an existing Subaccount in a Transaction Split

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

This is the sub account code

This is the transaction share for the subaccount

```
1#!/bin/sh2url="https://api.paystack.co/split/:id/subaccount/add"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "subaccount": "ACCT_eg4sob4590pq9vb", 7  "share": 208}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Subaccount added",4  "data": {5    "id": 2703655,6    "name": "Halfsies",7    "type": "percentage",8    "currency": "NGN",9    "integration": 463433,10    "domain": "test",11    "split_code": "SPL_RcScyW5jp2",12    "active": true,13    "bearer_type": "all-proportional",14    "bearer_subaccount": null,15    "createdAt": "2024-08-26T11:38:47.000Z",16    "updatedAt": "2024-08-26T11:50:47.000Z",17    "is_dynamic": false,18    "subaccounts": [19      {20        "subaccount": {21          "id": 1151727,22          "subaccount_code": "ACCT_6uujpqtzmnufzkw",23          "business_name": "Oasis Global",24          "description": "Oasis Global",25          "primary_contact_name": null,26          "primary_contact_email": null,27          "primary_contact_phone": null,28          "metadata": null,29          "settlement_bank": "Guaranty Trust Bank",30          "currency": "NGN",31          "account_number": "0123456047"32        },33        "share": 5034      },35      {36        "subaccount": {37          "id": 803508,38          "subaccount_code": "ACCT_eg4sob4590pq9vb",39          "business_name": "mmhm",40          "description": "mmhm",41          "primary_contact_name": null,42          "primary_contact_email": null,43          "primary_contact_phone": null,44          "metadata": null,45          "settlement_bank": "Zenith Bank",46          "currency": "NGN",47          "account_number": "0000000000"48        },49        "share": 2050      }51    ],52    "total_subaccounts": 253  }54}
```

## Remove Subaccount from Split

Remove a subaccount from a transaction split

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

This is the sub account code

```
1#!/bin/sh2url="https://api.paystack.co/split/:id/subaccount/remove"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "subaccount": "ACCT_eg4sob4590pq9vb"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Subaccount removed"4}
```