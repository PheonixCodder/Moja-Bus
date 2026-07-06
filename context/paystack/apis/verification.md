# Verification

The Verification API allows you to perform KYC processes.

## Resolve Account

Confirm an account belongs to the right customer

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

You can get the list of bank codes by calling the [List Banks](https://paystack.com/docs/api/miscellaneous#bank) endpoint

```
1#!/bin/sh2url="https://api.paystack.co/bank/resolve?account_number=0022728151&bank_code=063"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Account number resolved",4  "data": {5    "account_number": "0022728151",6    "account_name": "WES GIBBONS"7  }8}
```

## Validate Account

Confirm the authenticity of a customer's account number before sending money

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Customer's first and last name registered with their bank

Customer’s account number

This can take one of: \[ `personal`, `business` \]

The bank code of the customer’s bank. You can fetch the bank codes by using our [List Banks](https://paystack.com/docs/api/miscellaneous#bank) endpoint

The two digit ISO code of the customer’s bank

Customer’s mode of identity. This could be one of: \[ `identityNumber`, `passportNumber`, `businessRegistrationNumber` \]

Customer’s mode of identity number

```
1#!/bin/sh2url="https://api.paystack.co/bank/validate"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "bank_code": "632005",7  "country_code": "ZA",8  "account_number": "0123456789",9  "account_name": "Ann Bron",10  "account_type": "personal",11  "document_type": "identityNumber",12  "document_number": "1234567890123"13}'14
15curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Personal Account Verification attempted",4  "data": {5    "accountAcceptsDebits": true,6    "accountAcceptsCredits": true,7    "accountHolderMatch": true,8    "accountOpenForMoreThanThreeMonths": true,9    "accountOpen": true,10    "verified": true,11    "verificationMessage": "Account is verified successfully"12  }13}
```

## Resolve Card BIN

Get more information about a customer's card

### Path Parameters

First 6 characters of card

```
1#!/bin/sh2url="https://api.paystack.co/decision/bin/539983"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Bin resolved",4  "data": {5    "bin": "539983",6    "brand": "Mastercard",7    "sub_brand": "",8    "country_code": "NG",9    "country_name": "Nigeria",10    "card_type": "DEBIT",11    "bank": "Guaranty Trust Bank",12    "linked_bank_id": 913  }14}
```