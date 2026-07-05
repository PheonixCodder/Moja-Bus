# Card Preauthorization

The Preauthorization API enables South African merchants to hold an amount from a customer's account, and charge it later.

## Initialize Preauthorization

Initialize a preauthorization transaction for a new customer

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Only `ZAR` is supported for now

Unique transaction reference. Only `-`, `.`, `=` and alphanumeric characters allowed.

Fully qualified url, e.g. https://example.com/ . Use this to override the callback url provided on the dashboard for this transaction

Stringified JSON object of custom data. Kindly check the [Metadata](https://paystack.com/docs/payments/metadata) page for more information.

The split code of the transaction split. e.g. `SPL_98WF13Eb3w`

The code for the subaccount that owns the payment. e.g. `ACCT_8f4s1eq7ml6rlzj`

An amount used to override the split configuration for a single split payment. If set, the amount specified goes to the main account regardless of the split configuration.

Specifies who will pay the Paystack transaction charges for this transaction. Either `account` or `subaccount` (defaults to `account`).

Specify the action to take on the expiry date. It’s either `capture` or `release`. Defaults to `release`.

The number of days until the `expire_action` is executed. The minimum is 1 day and maximum 30 days. Defaults to 5 days.

```
1curl https://api.paystack.co/preauthorization/initialize2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "500000",6      "currency": "ZAR"7    }'8-X POST
```

```
1{2  "status": true,3  "message": "Authorization URL created",4  "data": {5    "authorization_url": "https://checkout.paystack.com/preauthorization/NDEyOTIyOmxpdmU6ZWloZ2VodTNyczZjanJj",6    "access_code": "NDEyOTIyOmxpdmU6ZWloZ2VodTNyczZjanJj",7    "reference": "eihgehu3rs6cjrc"8  }9}
```

## Capture Preauthorization

Charge a preauthorized transaction upon service delivery

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Unique transaction reference. Only `-`, `.`, `=` and alphanumeric characters allowed.

Only `ZAR` is supported for now

```
1curl https://api.paystack.co/preauthorization/capture2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "reference": "123-abc",5    "currency": "ZAR",6    "amount": "1000"7    }'8-X POST
```

```
1{2  "status": true,3  "message": "Capture attempted",4  "data": {5    "amount": 1000,6    "currency": "ZAR",7    "transaction_date": "2023-08-24T11:38:32.000Z",8    "status": "success",9    "reference": "123-abc",10    "domain": "live",11    "metadata": {12      "custom_fields": [13        {14          "display_name": "Cart Number",15          "variable_name": "cart_number",16          "value": "123443"17        }18      ]19    },20    "gateway_response": "Approved",21    "message": null,22    "channel": "preauth",23    "ip_address": null,24    "log": null,25    "fees": 373,26    "authorization": {27      "authorization_code": "AUTH_5h7ifp9x1h",28      "bin": "541333",29      "last4": "0028",30      "exp_month": "12",31      "exp_year": "2025",32      "channel": "card",33      "card_type": "mastercard ",34      "bank": "Absa Bank Limited, South Africa ",35      "country_code": "ZA",36      "brand": "mastercard",37      "reusable": true,38      "signature": "SIG_6bCAS8p20rANfmuYgQ2i",39      "account_name": null40    },41    "customer": {42      "id": 180063193,43      "first_name": null,44      "last_name": null,45      "email": "customer@email.com",46      "customer_code": "CUS_zi5os4fs31qxao0",47      "phone": null,48      "metadata": null,49      "risk_action": "default",50      "international_format_phone": null51    },52    "plan": null,53    "id": 150417300254  }55}
```

## Reserve Preauthorization

Hold an amount using an existing customer's authorization that's marked reusable.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

This is the code that is used to charge and identify a customer's previously used card

Only `ZAR` is supported for now

Unique transaction reference. Only `-`, `.`, `=` and alphanumeric characters allowed.

```
1curl https://api.paystack.co/preauthorization/reserve_authorization2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5      "email" : "test@paystack.com",6      "currency": "ZAR",7      "amount": 1000,8      "authorization_code": "AUTH_dalhwqi5vw",9    }'10-X POST
```

```
1{2  "status": true,3  "message": "Preauthorization successful",4  "data": {5    "id": 523,6    "domain": "live",7    "status": "authorized",8    "reference": "pre_p0xpfge2",9    "amount": 1600,10    "gateway_response": {11      "authorizeResponse": "Approved",12      "rrn": "KdeasineK"13    },14    "created_at": "2023-08-24T19:00:18.000Z",15    "released_at": null,16    "expiry_date": "2023-08-25T19:00:26.000Z",17    "currency": "ZAR",18    "metadata": null,19    "fees": 0,20    "authorization": {21      "authorization_code": "AUTH_dalhwqi5vw",22      "bin": "492312",23      "last4": "5652",24      "exp_month": "08",25      "exp_year": "2024",26      "channel": "card",27      "card_type": "visa credit",28      "bank": "NEDBANK",29      "country_code": "ZA",30      "brand": "visa",31      "reusable": true,32      "signature": "SIG_BAJR7TwTw5TwKOYCro5c",33      "account_name": null34    },35    "customer": {36      "id": 180063193,37      "first_name": null,38      "last_name": null,39      "email": "test@paystack.com",40      "customer_code": "CUS_zi5os4fs31qxao0",41      "phone": null,42      "metadata": null,43      "risk_action": "default",44      "international_format_phone": null45    },46    "merchant_id": 210002,47    "merchant_name": "ABC merchant",48    "expire_action": "release",49    "split_code": null,50    "split": null51  }52}
```

## Verify preauthorization

Fetch and confirm the status of a preauthorized transaction.

If you plan to store or make use of the transaction ID, you should represent it as a unsigned 64-bit integer. To learn more, [check out our changelog](https://paystack.com/docs/changelog/api/#june-2022).

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The transaction reference used to intiate the transaction

```
1#!/bin/sh2url="https://api.paystack.co/preauthorization/:reference"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Preauthorization retrieved",4  "data": {5    "id": 523,6    "domain": "live",7    "status": "captured",8    "reference": "pre_p0xpfge2",9    "amount": 1600,10    "created_at": "2023-08-24T19:00:18.000Z",11    "released_at": null,12    "expiry_date": "2023-08-25T19:00:26.000Z",13    "currency": "ZAR",14    "metadata": null,15    "fees": 100,16    "authorization": {17      "authorization_code": "AUTH_dalhwqi5vw",18      "bin": "492312",19      "last4": "5652",20      "exp_month": "08",21      "exp_year": "2024",22      "channel": "card",23      "card_type": "visa credit",24      "bank": "NEDBANK",25      "country_code": "ZA",26      "brand": "visa",27      "reusable": true,28      "signature": "SIG_BAJR7TwTw5TwKOYCro5c",29      "account_name": null30    },31    "customer": {32      "id": 180063193,33      "first_name": null,34      "last_name": null,35      "email": "test@paystack.com",36      "customer_code": "CUS_zi5os4fs31qxao0",37      "phone": null,38      "metadata": null,39      "risk_action": "default",40      "international_format_phone": null41    },42    "merchant_id": 210002,43    "merchant_name": "ABC merchant",44    "expire_action": "release",45    "captured_at": "2023-08-28T10:53:31.000Z",46    "split_code": null,47    "split": null48  }49}
```

## Release Preauthorization

For when a customer cancels an order or you want to release the hold from their card.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Unique transaction reference. Only `-`, `.`, `=` and alphanumeric characters allowed.

```
1curl https://api.paystack.co/preauthorization/release2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5      "reference": "123-abc"6    }'7-X POST
```

```
1{2  "status": true,3  "message": "Successfully released",4  "data": {5    "status": "released",6    "reference": "123-abc"7  }8}
```

List preauthorizations carried out on your integration

If you plan to store or make use of the transaction ID, you should represent it as a unsigned 64-bit integer. To learn more, [check out our changelog](https://paystack.com/docs/changelog/api/#june-2022).

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specify we use a default value of 50.

Specify exactly what page you want to retrieve. If not specify we use a default value of 1.

The unique customer ID to retrieve transactions belonging to that customer

Filter transactions by status. Either `authorized`, `captured`, `released`, `ongoing`, `failed`, `abandoned`

A timestamp from which to start listing transaction e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing transaction e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/preauthorization"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Preauthorizations retrieved",4  "data": [5    {6      "domain": "test",7      "status": "expired",8      "reference": "ctbaq5z6fkzsk2f",9      "amount": 1200,10      "created_at": "2023-08-21T06:30:31.000Z",11      "transaction_id": null,12      "captured_at": null,13      "released_at": null,14      "currency": "ZAR",15      "fees": 0,16      "authorization": {17        "authorization_code": "AUTH_qpbtw9k1kp",18        "bin": "408408",19        "last4": "4081",20        "exp_month": "12",21        "exp_year": "2030",22        "channel": "card",23        "card_type": "visa credit",24        "bank": "Test Bank",25        "country_code": "ZA",26        "brand": "visa",27        "reusable": true,28        "signature": "SIG_uUpNoxVEiErLme0Lo0e6",29        "account_name": null30      },31      "customer": {32        "id": 180063193,33        "first_name": null,34        "last_name": null,35        "email": "test@example.com",36        "customer_code": "CUS_zi5os4fs31qxao0",37        "phone": null,38        "metadata": null,39        "risk_action": "default",40        "international_format_phone": null41      },42      "id": 1032130943    },44    {45      "domain": "test",46      "status": "captured",47      "reference": "adoiasdiruvme",48      "amount": 500,49      "created_at": "2025-01-08T10:51:24.000Z",50      "transaction_id": 4563444462,51      "captured_at": "2025-01-08T10:53:31.000Z",52      "released_at": null,53      "currency": "ZAR",54      "fees": 115,55      "authorization": {56        "authorization_code": "AUTH_3nbm4tww49",57        "bin": "408408",58        "last4": "4081",59        "exp_month": "12",60        "exp_year": "2030",61        "channel": "card",62        "card_type": "visa credit",63        "bank": "Test Bank",64        "country_code": "ZA",65        "brand": "visa",66        "reusable": true,67        "signature": "SIG_uUpNoxVEiErLme0Lo0e6",68        "account_name": null69      },70      "customer": {71        "id": 226230427,72        "first_name": null,73        "last_name": null,74        "email": "chonky@example.com",75        "customer_code": "CUS_6bklfq9zapdbdpp",76        "phone": null,77        "metadata": null,78        "risk_action": "default",79        "international_format_phone": null80      },81      "id": 15302882    },83    {84      "domain": "test",85      "status": "released",86      "reference": "abcoeii-123adoi",87      "amount": 8888,88      "created_at": "2025-01-08T12:48:02.000Z",89      "transaction_id": null,90      "captured_at": null,91      "released_at": "2025-01-08T13:21:35.000Z",92      "currency": "ZAR",93      "fees": 115,94      "customer": {95        "id": 226271601,96        "first_name": null,97        "last_name": null,98        "email": "test@example.com",99        "customer_code": "CUS_l3hkvdfhxaxdad",100        "phone": null,101        "metadata": null,102        "risk_action": "default",103        "international_format_phone": null104      },105      "id": 53041032106    }107  ],108  "meta": {109    "total": 1,110    "skipped": 0,111    "perPage": 50,112    "page": 1,113    "pageCount": 1114  }115}
```