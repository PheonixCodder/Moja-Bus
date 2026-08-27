## Subaccounts

The Subaccounts API allows you create and manage subaccounts on your integration. Subaccounts can be used to split payment between two accounts (your main account and a sub account).

## Create Subaccount

Create a subacount on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Name of business for subaccount

Bank Code for the bank. You can get the list of Bank Codes by calling the [List Banks](https://paystack.com/docs/api/miscellaneous#bank) endpoint.

The percentage the main account receives from each payment made to the subaccount

A description for this subaccount

A contact email for the subaccount

A name for the contact person for this subaccount

A phone number to call for this subaccount

Stringified JSON object. Add a `custom_fields` attribute which has an array of objects if you would like the fields to be added to your transaction when displayed on the dashboard. Sample: `{"custom_fields":[{"display_name":"Cart ID","variable_name": "cart_id","value": "8393"}]}`

```
1#!/bin/sh2url="https://api.paystack.co/subaccount"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "business_name": "Oasis", 7  "settlement_bank": "058", 8  "account_number": "0123456047", 9  "percentage_charge": 30 10}'11
12curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Subaccount created",4  "data": {5    "business_name": "Oasis",6    "account_number": "0123456047",7    "percentage_charge": 30,8    "settlement_bank": "Guaranty Trust Bank",9    "currency": "NGN",10    "bank": 9,11    "integration": 463433,12    "domain": "test",13    "account_name": "LARRY JAMES  O",14    "product": "collection",15    "managed_by_integration": 463433,16    "subaccount_code": "ACCT_6uujpqtzmnufzkw",17    "is_verified": false,18    "settlement_schedule": "AUTO",19    "active": true,20    "migrate": false,21    "id": 1151727,22    "createdAt": "2024-08-26T09:24:28.723Z",23    "updatedAt": "2024-08-26T09:24:28.723Z"24  }25}
```

## List Subaccounts

List subaccounts available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing subaccounts e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing subaccounts e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/subaccount"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Subaccounts retrieved",4  "data": [5    {6      "id": 1151727,7      "subaccount_code": "ACCT_6uujpqtzmnufzkw",8      "business_name": "Oasis",9      "description": "Oasis",10      "primary_contact_name": null,11      "primary_contact_email": null,12      "primary_contact_phone": null,13      "metadata": null,14      "percentage_charge": 30,15      "settlement_bank": "Guaranty Trust Bank",16      "bank_id": 9,17      "account_number": "0123456047",18      "currency": "NGN",19      "active": 120    }21  ],22  "meta": {23    "total": 27,24    "skipped": 0,25    "perPage": 50,26    "page": 1,27    "pageCount": 128  }29}
```

## Fetch Subaccount

Get details of a subaccount on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The subaccount `ID` or `code` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/subaccount/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Subaccount retrieved",4  "data": {5    "integration": 463433,6    "bank": 9,7    "managed_by_integration": 463433,8    "domain": "test",9    "subaccount_code": "ACCT_6uujpqtzmnufzkw",10    "business_name": "Oasis",11    "description": null,12    "primary_contact_name": null,13    "primary_contact_email": null,14    "primary_contact_phone": null,15    "metadata": null,16    "percentage_charge": 30,17    "is_verified": false,18    "settlement_bank": "Guaranty Trust Bank",19    "account_number": "0123456047",20    "settlement_schedule": "AUTO",21    "active": true,22    "migrate": false,23    "currency": "NGN",24    "account_name": "LARRY JAMES  O",25    "product": "collection",26    "id": 1151727,27    "createdAt": "2024-08-26T09:24:28.000Z",28    "updatedAt": "2024-08-26T09:24:28.000Z"29  }30}
```

## Update Subaccount

Update a subaccount details on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

Name of business for subaccount

A description for this subaccount

Bank Code for the bank. You can get the list of Bank Codes by calling the [List Banks](https://paystack.com/docs/api/miscellaneous#bank) endpoint.

Activate or deactivate a subaccount. Set value to `true` to activate subaccount or `false` to deactivate the subaccount.

The default percentage charged when receiving on behalf of this subaccount

A contact email for the subaccount

A name for the contact person for this subaccount

A phone number to call for this subaccount

Any of `auto`, `weekly`, \`monthly\`, \`manual\`. Auto means payout is T+1 and manual means payout to the subaccount should only be made when requested. Defaults to `auto`

Stringified JSON object. Add a `custom_fields` attribute which has an array of objects if you would like the fields to be added to your transaction when displayed on the dashboard. Sample: `{"custom_fields":[{"display_name":"Cart ID","variable_name": "cart_id","value": "8393"}]}`

```
1#!/bin/sh2url="https://api.paystack.co/subaccount/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "business_name": "Oasis Global", 7  "description": "Provide IT services"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Subaccount updated",4  "data": {5    "domain": "test",6    "subaccount_code": "ACCT_6uujpqtzmnufzkw",7    "business_name": "Oasis Global",8    "description": "Provide IT services",9    "primary_contact_name": null,10    "primary_contact_email": null,11    "primary_contact_phone": null,12    "metadata": null,13    "percentage_charge": 30,14    "is_verified": false,15    "settlement_bank": "Guaranty Trust Bank",16    "account_number": "0123456047",17    "settlement_schedule": "AUTO",18    "active": true,19    "migrate": false,20    "currency": "NGN",21    "account_name": "LARRY JAMES  O",22    "product": "collection",23    "id": 1151727,24    "integration": 463433,25    "bank": 9,26    "managed_by_integration": 463433,27    "createdAt": "2024-08-26T09:24:28.000Z",28    "updatedAt": "2024-08-26T09:34:18.000Z"29  }30}
```