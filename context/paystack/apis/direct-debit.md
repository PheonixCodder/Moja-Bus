# Direct Debit

The Direct Debit API allows you manage the authorization on your customer's bank accounts.

## Trigger Activation Charge

Trigger an activation charge on pending mandates on behalf of your customers.

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

An array of customer IDs with pending mandate authorizations.

```
1#!/bin/sh2curl https://api.paystack.co/directdebit/activation-charge3-H "Authorization: Bearer YOUR_SECRET_KEY"4-H "Content-Type: application/json"5-d '{ 6        "customer_ids": [28958104, 983697220]7    }'8-X PUT
```

```
1{2  "status": true,3  "message": "Mandate is queued for retry"4}
```

Get the list of direct debit mandates on your integration.

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

The cursor value of the next set of authorizations to fetch. You can get this from the meta object of the response

Filter by the authorization status. Accepted values are: `pending`, `active`, `revoked`

The number of authorizations to fetch per request

```
1#!/bin/sh2url="https://api.paystack.co/directdebit/mandate-authorizations"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Mandate authorizations retrieved successfully",4  "data": [5    {6      "id": 112244,7      "status": "active",8      "mandate_id": 1560169,9      "authorization_id": 1069309917,10      "authorization_code": "AUTH_lEt8QgrSfW",11      "integration_id": 463433,12      "account_number": "0123456789",13      "bank_code": "058",14      "bank_name": "Guaranty Trust Bank",15      "customer": {16        "id": 28958104,17        "customer_code": "CUS_5kye9bc41uw15pb",18        "email": "customer@email.com",19        "first_name": "Booker",20        "last_name": "Jones"21      },22      "authorized_at": "2025-06-23T12:47:10.632Z"23    }24  ],25  "meta": {26    "per_page": 10,27    "next": "MTI1OTc=",28    "count": 10,29    "total": 4030  }31}
```