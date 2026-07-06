## Charges

The Charge API allows you to configure payment channel of your choice when initiating a payment.

## Create Charge

Initiate a payment by integrating the [payment channel](https://paystack.com/docs/payments/payment-channels/) of your choice.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

The split code of a previously created split. e.g. `SPL_98WF13Eb3w`

The code for the subaccount that owns the payment. e.g. `ACCT_8f4s1eq7ml6rlzj`

An amount used to override the split configuration for a single split payment. If set, the amount specified goes to the main account regardless of the split configuration.

Use this param to indicate who bears the transaction charges. Allowed values are: `account` or `subaccount` (defaults to `account`).

Holds the bank account details of the customer to charge

The customer's bank code which can be gotten via the List Bank endpoint.

The customer’s account number

The customer’s phone number. This is specifically for Kuda bank.

The 6-digit code generated from the Kuda app.

Takes the settings for the Pay with Transfer (PwT) and Pesalink channel.

Holds the expiry time of the account for a transaction.

USSD type to charge. Currently supported in Nigeria only

The USSD provider code. `737` is currently the only supposed type.

Mobile money details. Currently supported in Ghana, Kenya and CIV.

The customer's phone number.

The M-PESA till account number. This should be used in place of the `phone` parameter.

The type of identifier being used. One of: `mtn` | `atl` | `vod` | `mpesa` | `orange` | `wave` | `mpesa_offline` | `mptill`

Holds the provider details for payment completion. Currently supported in South Africa only.

`scan-to-pay` is currently the only supported provider.

Holds the details of the provider. Currently supported in South Africa only.

`ozow` is currently the only supported provider.

The account holder identifier.

The type of identifier being used. One of: `CELLPHONE` | `IDNUMBER` | `ACCOUNTNUMBER`

The matching value of the identifier type.

An authorization code to charge (don't send if charging a bank account)

4-digit PIN (send with a non-reusable authorization code)

Used for passing additional details for your post-payment processes

Unique transaction reference. Only `-`, `` .` ``, `=` and alphanumeric characters allowed.

This is the unique identifier of the device a user uses in making payment. Only `-`, `` .` ``, `=` and alphanumeric characters allowed.

```
1#!/bin/sh2url="https://api.paystack.co/charge"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "email": "customer@email.com",7  "amount": "10000",8  "metadata": {9    "custom_fields": [10      {11        "value": "makurdi",12        "display_name": "Donation for",13        "variable_name": "donation_for"14      }15    ]16  },17  "bank": {18      "code": "057",19      "account_number": "0000000000"20  },21  "birthday": "1995-12-23"22}'23
24curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "amount": 200,6    "currency": "NGN",7    "transaction_date": "2017-05-24T05:56:12.000Z",8    "status": "success",9    "reference": "zuvbpizfcf2fs7y",10    "domain": "test",11    "metadata": {12      "custom_fields": [13        {14          "display_name": "Merchant name",15          "variable_name": "merchant_name",16          "value": "Van Damme"17        },18        {19          "display_name": "Paid Via",20          "variable_name": "paid_via",21          "value": "API call"22        }23      ]24    },25    "gateway_response": "Successful",26    "message": null,27    "channel": "card",28    "ip_address": "54.154.89.28, 162.158.38.82, 172.31.38.35",29    "log": null,30    "fees": 3,31    "authorization": {32      "authorization_code": "AUTH_6tmt288t0o",33      "bin": "408408",34      "last4": "4081",35      "exp_month": "12",36      "exp_year": "2020",37      "channel": "card",38      "card_type": "visa visa",39      "bank": "TEST BANK",40      "country_code": "NG",41      "brand": "visa",42      "reusable": true,43      "signature": "SIG_uSYN4fv1adlAuoij8QXh",44      "account_name": "BoJack Horseman"45    },46    "customer": {47      "id": 14571,48      "first_name": null,49      "last_name": null,50      "email": "test@email.co",51      "customer_code": "CUS_hns72vhhtos0f0k",52      "phone": null,53      "metadata": null,54      "risk_action": "default"55    },56    "plan": null57  }58}
```

## Submit PIN

Submit PIN to continue a charge

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Reference for transaction that requested pin

```
1#!/bin/sh2url="https://api.paystack.co/charge/submit_pin"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "pin": "1234", 7  "reference": "5bwib5v6anhe9xa"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "id": 2046671778,6    "domain": "test",7    "status": "success",8    "reference": "36xz3b9rie9ppvz",9    "amount": 10000,10    "message": "madePayment",11    "gateway_response": "Approved",12    "paid_at": "2022-08-24T12:00:18.000Z",13    "created_at": "2022-08-24T11:58:41.000Z",14    "channel": "bank",15    "currency": "NGN",16    "ip_address": "172.31.68.204",17    "metadata": "",18    "log": null,19    "fees": 50,20    "fees_split": null,21    "authorization": {22      "authorization_code": "AUTH_nrp5ly1goc",23      "bin": "000XXX",24      "last4": "X000",25      "exp_month": "12",26      "exp_year": "9999",27      "channel": "bank",28      "card_type": "",29      "bank": "Zenith Bank",30      "country_code": "NG",31      "brand": "Zenith Emandate",32      "reusable": false,33      "signature": null,34      "account_name": null35    },36    "customer": {37      "id": 44494174,38      "first_name": null,39      "last_name": null,40      "email": "charge@email.com",41      "customer_code": "CUS_cm4hqzmhg0u0ded",42      "phone": null,43      "metadata": null,44      "risk_action": "default",45      "international_format_phone": null46    },47    "plan": null,48    "split": {},49    "order_id": null,50    "paidAt": "2022-08-24T12:00:18.000Z",51    "createdAt": "2022-08-24T11:58:41.000Z",52    "requested_amount": 10000,53    "pos_transaction_data": null,54    "source": null,55    "fees_breakdown": null,56    "transaction_date": "2022-08-24T11:58:41.000Z",57    "plan_object": {},58    "subaccount": {}59  }60}
```

## Submit OTP

Submit OTP to complete a charge

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Reference for ongoing transaction

```
1#!/bin/sh2url="https://api.paystack.co/charge/submit_otp"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "otp": "123456", 7  "reference": "5bwib5v6anhe9xa"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "id": 2046671778,6    "domain": "test",7    "status": "success",8    "reference": "36xz3b9rie9ppvz",9    "amount": 10000,10    "message": "madePayment",11    "gateway_response": "Approved",12    "paid_at": "2022-08-24T12:00:18.000Z",13    "created_at": "2022-08-24T11:58:41.000Z",14    "channel": "bank",15    "currency": "NGN",16    "ip_address": "172.31.68.204",17    "metadata": "",18    "log": null,19    "fees": 50,20    "fees_split": null,21    "authorization": {22      "authorization_code": "AUTH_nrp5ly1goc",23      "bin": "000XXX",24      "last4": "X000",25      "exp_month": "12",26      "exp_year": "9999",27      "channel": "bank",28      "card_type": "",29      "bank": "Zenith Bank",30      "country_code": "NG",31      "brand": "Zenith Emandate",32      "reusable": false,33      "signature": null,34      "account_name": null35    },36    "customer": {37      "id": 44494174,38      "first_name": null,39      "last_name": null,40      "email": "charge@email.com",41      "customer_code": "CUS_cm4hqzmhg0u0ded",42      "phone": null,43      "metadata": null,44      "risk_action": "default",45      "international_format_phone": null46    },47    "plan": null,48    "split": {},49    "order_id": null,50    "paidAt": "2022-08-24T12:00:18.000Z",51    "createdAt": "2022-08-24T11:58:41.000Z",52    "requested_amount": 10000,53    "pos_transaction_data": null,54    "source": null,55    "fees_breakdown": null,56    "transaction_date": "2022-08-24T11:58:41.000Z",57    "plan_object": {},58    "subaccount": {}59  }60}
```

## Submit Phone

Submit phone number when requested

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Reference for ongoing transaction

```
1#!/bin/sh2url="https://api.paystack.co/charge/submit_phone"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "phone": "08012345678", 7  "reference": "5bwib5v6anhe9xa"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "id": 2046671778,6    "domain": "test",7    "status": "success",8    "reference": "36xz3b9rie9ppvz",9    "amount": 10000,10    "message": "madePayment",11    "gateway_response": "Approved",12    "paid_at": "2022-08-24T12:00:18.000Z",13    "created_at": "2022-08-24T11:58:41.000Z",14    "channel": "bank",15    "currency": "NGN",16    "ip_address": "172.31.68.204",17    "metadata": "",18    "log": null,19    "fees": 50,20    "fees_split": null,21    "authorization": {22      "authorization_code": "AUTH_nrp5ly1goc",23      "bin": "000XXX",24      "last4": "X000",25      "exp_month": "12",26      "exp_year": "9999",27      "channel": "bank",28      "card_type": "",29      "bank": "Zenith Bank",30      "country_code": "NG",31      "brand": "Zenith Emandate",32      "reusable": false,33      "signature": null,34      "account_name": null35    },36    "customer": {37      "id": 44494174,38      "first_name": null,39      "last_name": null,40      "email": "charge@email.com",41      "customer_code": "CUS_cm4hqzmhg0u0ded",42      "phone": null,43      "metadata": null,44      "risk_action": "default",45      "international_format_phone": null46    },47    "plan": null,48    "split": {},49    "order_id": null,50    "paidAt": "2022-08-24T12:00:18.000Z",51    "createdAt": "2022-08-24T11:58:41.000Z",52    "requested_amount": 10000,53    "pos_transaction_data": null,54    "source": null,55    "fees_breakdown": null,56    "transaction_date": "2022-08-24T11:58:41.000Z",57    "plan_object": {},58    "subaccount": {}59  }60}
```

## Submit Birthday

Submit Birthday when requested

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Birthday submitted by user e.g. **2016-09-21**

Reference for ongoing transaction

```
1#!/bin/sh2url="https://api.paystack.co/charge/submit_birthday"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "birthday": "1961-09-21", 7  "reference": "5bwib5v6anhe9xa"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "id": 2046671778,6    "domain": "test",7    "status": "success",8    "reference": "36xz3b9rie9ppvz",9    "amount": 10000,10    "message": "madePayment",11    "gateway_response": "Approved",12    "paid_at": "2022-08-24T12:00:18.000Z",13    "created_at": "2022-08-24T11:58:41.000Z",14    "channel": "bank",15    "currency": "NGN",16    "ip_address": "172.31.68.204",17    "metadata": "",18    "log": null,19    "fees": 50,20    "fees_split": null,21    "authorization": {22      "authorization_code": "AUTH_nrp5ly1goc",23      "bin": "000XXX",24      "last4": "X000",25      "exp_month": "12",26      "exp_year": "9999",27      "channel": "bank",28      "card_type": "",29      "bank": "Zenith Bank",30      "country_code": "NG",31      "brand": "Zenith Emandate",32      "reusable": false,33      "signature": null,34      "account_name": null35    },36    "customer": {37      "id": 44494174,38      "first_name": null,39      "last_name": null,40      "email": "charge@email.com",41      "customer_code": "CUS_cm4hqzmhg0u0ded",42      "phone": null,43      "metadata": null,44      "risk_action": "default",45      "international_format_phone": null46    },47    "plan": null,48    "split": {},49    "order_id": null,50    "paidAt": "2022-08-24T12:00:18.000Z",51    "createdAt": "2022-08-24T11:58:41.000Z",52    "requested_amount": 10000,53    "pos_transaction_data": null,54    "source": null,55    "fees_breakdown": null,56    "transaction_date": "2022-08-24T11:58:41.000Z",57    "plan_object": {},58    "subaccount": {}59  }60}
```

## Submit Address

Submit address to continue a charge

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Address submitted by user

Reference for ongoing transaction

Zipcode submitted by user

```
1#!/bin/sh2url="https://api.paystack.co/charge/submit_address"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "reference": "7c7rpkqpc0tijs8",7  "address": "140 N 2ND ST",8  "city": "Stroudsburg",9  "state": "PA",10  "zip_code": "18360"11}'12
13curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "message": "Charge attempted",3  "status": true,4  "data": {5    "message": "",6    "paidAt": "2020-05-21T15:16:00.000Z",7    "plan": null,8    "log": null,9    "ip_address": "35.177.113.19",10    "createdAt": "2020-05-21T15:14:25.000Z",11    "domain": "live",12    "fees": 390,13    "metadata": "",14    "requested_amount": 10000,15    "id": 102039,16    "currency": "NGN",17    "status": "success",18    "transaction_date": "2020-05-21T15:14:25.000Z",19    "reference": "7c7rpkqpc0tijs8",20    "subaccount": {},21    "customer": {22      "email": "ben@jude.com",23      "last_name": "Ben",24      "metadata": null,25      "customer_code": "CUS_bpy9ciomcstg55y",26      "risk_action": "default",27      "first_name": "Jude",28      "phone": "",29      "id": 1620030    },31    "order_id": null,32    "plan_object": {},33    "authorization": {34      "signature": "SIG_5wBvKoAT64nwSJgZkHvQ",35      "authorization_code": "AUTH_82e26bc6yb",36      "reusable": true,37      "exp_month": "08",38      "card_type": "visa DEBIT",39      "last4": "4633",40      "account_name": "BoJack Horseman",41      "channel": "card",42      "brand": "visa",43      "country_code": "US",44      "bin": "440066",45      "bank": "",46      "exp_year": "2024"47    },48    "channel": "card",49    "amount": 10000,50    "created_at": "2020-05-21T15:14:25.000Z",51    "gateway_response": "Approved",52    "fees_split": null,53    "paid_at": "2020-05-21T15:16:00.000Z"54  }55}
```

## Check Pending Charge

When you get `pending` as a charge status or if there was an exception when calling any of the /charge endpoints, wait 10 seconds or more, then make a check to see if its status has changed. Don't call too early as you may get a lot more pending than you should.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/charge/{reference}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "amount": 200,6    "currency": "NGN",7    "transaction_date": "2017-05-24T05:56:12.000Z",8    "status": "success",9    "reference": "zuvbpizfcf2fs7y",10    "domain": "test",11    "metadata": {12      "custom_fields": [13        {14          "display_name": "Merchant name",15          "variable_name": "merchant_name",16          "value": "Van Damme"17        },18        {19          "display_name": "Paid Via",20          "variable_name": "paid_via",21          "value": "API call"22        }23      ]24    },25    "gateway_response": "Successful",26    "message": null,27    "channel": "card",28    "ip_address": "54.154.89.28, 162.158.38.82, 172.31.38.35",29    "log": null,30    "fees": 3,31    "authorization": {32      "authorization_code": "AUTH_6tmt288t0o",33      "bin": "408408",34      "last4": "4081",35      "exp_month": "12",36      "exp_year": "2020",37      "channel": "card",38      "card_type": "visa visa",39      "bank": "TEST BANK",40      "country_code": "NG",41      "brand": "visa",42      "reusable": true,43      "signature": "SIG_uSYN4fv1adlAuoij8QXh",44      "account_name": "BoJack Horseman"45    },46    "customer": {47      "id": 14571,48      "first_name": null,49      "last_name": null,50      "email": "test@email.co",51      "customer_code": "CUS_hns72vhhtos0f0k",52      "phone": null,53      "metadata": null,54      "risk_action": "default"55    },56    "plan": null57  }58}
```