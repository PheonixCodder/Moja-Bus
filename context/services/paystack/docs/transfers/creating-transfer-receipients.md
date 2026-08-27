# Creating Transfer Recipients

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

To send money from your integration, you need to collect the customer’s details to create a beneficiary.

A transfer recipient is a beneficiary created on your integration to allow you send money. Before sending money from your integration, you need to collect the customer’s details and use their details to create a transfer recipient.

We support the following recipient types:

| Type | Description | Currency |
| --- | --- | --- |
| `ghipss` | This means Ghana Interbank Payment and Settlement Systems. It represents bank account in Ghana. | **GHS** |
| `mobile_money` | Mobile Money or MoMo is an account tied to a mobile number. | **GHS/KES** |
| `kepss` | This is the Kenya Electronic Payment and Settlement System. It represents KES and USD bank accounts in Kenya. | **KES/USD** |
| `nuban` | This means the Nigerian Uniform Bank Account Number. It represents bank accounts in Nigeria. | **NGN** |
| `basa` | This means the Banking Association South Africa. It represents bank accounts in South Africa. | **ZAR** |
| `authorization` | This is a unique code that represents a customer’s card. We return an authorization code after a user makes a payment with their card. | **All** |

To create the transfer recipient, make a `POST` request to the [transfer recipientAPI](https://paystack.com/docs/api/transfer-recipient#create) passing one of the following customer’s detail:

1.  Bank account
2.  Mobile money
3.  Authorization code

## Bank account

When creating a transfer recipient with a bank account, you need to collect the customer’s bank details. Typically, the account number and associated bank should suffice, but some countries require more details particularly for account verification. You should design your user interface to allow the collection of the necessary details in the country of operation.

### List banks

When creating your user interface (UI) to collect the user’s bank details, you’ll need to populate the UI with a list of banks. We provide a [list bankAPI](https://paystack.com/docs/api/miscellaneous#bank) endpoint that you can use to populate your UI with available banks in your country.

To fetch a list of banks in a country, make a `GET` request passing the `currency` in the query parameter:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/bank?currency=NGN2-H "Authorization: Bearer YOUR_SECRET_KEY"3-X GET
```

```
1{2  "status": true,3  "message": "Banks retrieved",4  "data": [5    {6      "name": "Abbey Mortgage Bank",7      "slug": "abbey-mortgage-bank",8      "code": "801",9      "longcode": "",10      "gateway": null,11      "pay_with_bank": false,12      "active": true,13      "is_deleted": false,14      "country": "Nigeria",15      "currency": "NGN",16      "type": "nuban",17      "id": 174,18      "createdAt": "2020-12-07T16:19:09.000Z",19      "updatedAt": "2020-12-07T16:19:19.000Z"20    }21  ]22}
```

##### Ghanaian bank transfer support

At the moment, transfers can't be made to the **Bank of Ghana**. We recommend that you exclude it from the list of banks as we work on supporting transfers to it.

### Verify the account number

You need to collect the destination account number and confirm that it’s valid. This is to ensure you don’t send money to the wrong or invalid account.

As stated earlier, account verification requires different details in different countries. You can follow the process for account verification for the country of operation in the table below:

| Currency | Verification |
| --- | --- |
| **NGN/GHS** | [Resolve Account Number](https://paystack.com/docs/identity-verification/verify-account-number/#resolve-account-number) |
| **ZAR** | [Validate Account](https://paystack.com/docs/identity-verification/verify-account-number/#account-validation) |

### Create recipient

With the verification completed, you can pass the customer’s bank details and the recipient `type` to the [Create Transfer recipientAPI](https://paystack.com/docs/api/transfer-recipient#create) endpoint:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transferrecipient2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "type": "nuban", 5      "name": "John Doe", 6      "account_number": "0001234567", 7      "bank_code": "058", 8      "currency": "NGN"9    }'10-X POST
```

```
1{2  "status": true,3  "message": "Transfer recipient created successfully",4  "data": {5    "active": true,6    "createdAt": "2020-05-13T13:59:07.741Z",7    "currency": "NGN",8    "domain": "test",9    "id": 6788170,10    "integration": 428626,11    "name": "John Doe",12    "recipient_code": "RCP_t0ya41mp35flk40",13    "type": "nuban",14    "updatedAt": "2020-05-13T13:59:07.741Z",15    "is_deleted": false,16    "details": {17      "authorization_code": null,18      "account_number": "0001234567",19      "account_name": null,20      "bank_code": "058",21      "bank_name": "Guaranty Trust Bank"22    }23  }24}
```

## Mobile money

##### Feature availability

This feature is currently available to businesses in Ghana and Kenya.

Mobile money allows a merchant send money to a customer’s mobile number. To start with, you need to collect the customer’s phone number and telco. To fetch a list of supported telcos for mobile money, you can add `currency` (either `KES` or `GHS`) and `type` in the query parameters for the [list bankAPI](https://paystack.com/docs/api/miscellaneous#bank) endpoint:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/bank?currency=GHS&type=mobile_money2-H "Authorization: Bearer YOUR_SECRET_KEY"3-X GET4
```

```
1{2  "status": true,3  "message": "Banks retrieved",4  "data": [5    {6      "name": "AirtelTigo",7      "slug": "atl-mobile-money",8      "code": "ATL",9      "longcode": "",10      "gateway": null,11      "pay_with_bank": false,12      "active": true,13      "is_deleted": null,14      "country": "Ghana",15      "currency": "GHS",16      "type": "mobile_money",17      "id": 29,18      "createdAt": "2018-03-29T12:54:59.000Z",19      "updatedAt": "2020-01-24T10:01:06.000Z"20    },21    {22      "name": "MTN",23      "slug": "mtn-mobile-money",24      "code": "MTN",25      "longcode": "",26      "gateway": null,27      "pay_with_bank": false,28      "active": true,29      "is_deleted": null,30      "country": "Ghana",31      "currency": "GHS",32      "type": "mobile_money",33      "id": 28,34      "createdAt": "2018-03-29T12:54:59.000Z",35      "updatedAt": "2019-10-22T11:04:46.000Z"36    },37    {38      "name": "Vodafone",39      "slug": "vod-mobile-money",40      "code": "VOD",41      "longcode": "",42      "gateway": null,43      "pay_with_bank": false,44      "active": true,45      "is_deleted": null,46      "country": "Ghana",47      "currency": "GHS",48      "type": "mobile_money",49      "id": 66,50      "createdAt": "2018-03-29T12:54:59.000Z",51      "updatedAt": "2019-10-22T11:05:08.000Z"52    }53  ]54}
```

With the customer’s mobile number, you can then create a recipient by using the telco code as the `bank_code` and the mobile number as the `account_number`:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transferrecipient2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "type": "mobile_money", 5      "name": "Abina Nana", 6      "account_number": "0551234987", 7      "bank_code": "MTN", 8      "currency": "GHS"9    }'10-X POST
```

```
1{2  "status": true,3  "message": "Transfer recipient created successfully",4  "data": {5    "active": true,6    "createdAt": "2022-02-21T12:57:02.156Z",7    "currency": "GHS",8    "domain": "test",9    "id": 25753454,10    "integration": 519035,11    "name": "Abina Nana",12    "recipient_code": "RCP_u2tnoyjjvh95pzm",13    "type": "mobile_money",14    "updatedAt": "2022-02-21T12:57:02.156Z",15    "is_deleted": false,16    "isDeleted": false,17    "details": {18      "authorization_code": null,19      "account_number": "0551234987",20      "account_name": null,21      "bank_code": "MTN",22      "bank_name": "MTN"23    }24  }25}
```

Kenyan businesses have several mobile money options for the `bank_code`:

1.  `MPESA` for individual Mpesa users
2.  `MPPAYBILL` for Paybill numbers and requires additional information during disbursement
3.  `MPTILL` for business Till numbers

The recipient type for Paybill and Till numbers is `mobile_money_business`.

cURLNodePHP

Show Response

```
1#!/bin/sh2curl https://api.paystack.co/transferrecipient3-H "Authorization: Bearer YOUR_SECRET_KEY"4-H "Content-Type: application/json"5-d '{ "type": "mobile_money_business",6      "name": "Till Transfer",7      "bank_code": "MPTILL",8      "account_number": "247247",9      "currency": "KES"10    }'11-X POST
```

```
1{2  "status": true,3  "message": "Transfer recipient created successfully",4  "data": {5    "active": true,6    "createdAt": "2024-11-28T09:28:50.000Z",7    "currency": "KES",8    "description": null,9    "domain": "test",10    "email": null,11    "id": 92176030,12    "integration": 845995,13    "metadata": null,14    "name": "Till Transfer Example",15    "recipient_code": "RCP_5vl8b2yma7xdnjp",16    "type": "mobile_money_business",17    "updatedAt": "2024-11-28T09:28:50.000Z",18    "is_deleted": false,19    "isDeleted": false,20    "details": {21      "authorization_code": null,22      "account_number": "247247",23      "account_name": null,24      "bank_code": "MPTILL",25      "bank_name": "M-PESA Till"26    }27  }28}
```

## Authorization code

An authorization code is returned after a successful card payment by a customer. Combining the authorization code with the email address used for payment, you can create a transfer recipient:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transferrecipient2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "type": "authorization", 5      "name": "Revs Ore", 6      "email": "revs@ore.com", 7      "authorization_code": "AUTH_ncx8hews93"8    }'9-X POST
```

```
1{2  "status": true,3  "message": "Transfer recipient created successfully",4  "data": {5    "active": true,6    "createdAt": "2022-02-21T11:35:59.302Z",7    "currency": "NGN",8    "domain": "test",9    "email": "revs@ore.com",10    "id": 25747878,11    "integration": 463433,12    "name": "Revs Ore",13    "recipient_code": "RCP_wql6bj95bll7m6h",14    "type": "authorization",15    "updatedAt": "2022-02-21T11:35:59.302Z",16    "is_deleted": false,17    "isDeleted": false,18    "details": {19      "authorization_code": "AUTH_ncx8hews93",20      "account_number": null,21      "account_name": null,22      "bank_code": "057",23      "bank_name": "Zenith Bank"24    }25  }26}
```

##### Account Number Association

If an account number isn’t associated with the authorization code, we return a response with a message: `Account details not found for this authorization`. If you get this error, request the customer's account details and follow the process to create a transfer recipient using a bank account.

## Save the recipient code

The `recipient_code` in the `data` object of the response is the unique identifier for the customer and would be used to make transfers to the specified account. This code should be saved with the customer’s records in your database.

```json
1{2  "status": true,3  "message": "Transfer recipient created successfully",4  "data": {5    "active": true,6    "createdAt": "2022-02-21T11:35:59.302Z",7    "currency": "NGN",8    "domain": "test",9    "email": "revs@ore.com",10    "id": 25747878,11    "integration": 463433,12    "name": "Revs Ore",13    "recipient_code": "RCP_wql6bj95bll7m6h",14    "type": "authorization",15    "updatedAt": "2022-02-21T11:35:59.302Z",16    "is_deleted": false,17    "isDeleted": false,18    "details": {19      "authorization_code": "AUTH_ncx8hews93",20      "account_number": null,21      "account_name": null,22      "bank_code": "057",23      "bank_name": "Zenith Bank"24    }25  }26}
```

###### On this Page

-   [Bank account](https://paystack.com/docs/transfers/creating-transfer-recipients/#bank-account)
-   [Mobile money](https://paystack.com/docs/transfers/creating-transfer-recipients/#mobile-money)
-   [Authorization code](https://paystack.com/docs/transfers/creating-transfer-recipients/#authorization-code)
-   [Save the recipient code](https://paystack.com/docs/transfers/creating-transfer-recipients/#save-the-recipient-code)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)