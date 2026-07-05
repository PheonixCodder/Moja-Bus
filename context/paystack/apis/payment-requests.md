# Payment Requests

The Payment Requests API allows you manage requests for payment of goods and services.

## Create Payment Request

Create a payment request for a transaction on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Payment request amount. It should be used when line items and tax values aren't specified.

ISO 8601 representation of request due date

A short description of the payment request

Array of line items int the format `[{"name":"item 1", "amount":2000, "quantity": 1}]`

Array of taxes to be charged in the format `[{"name":"VAT", "amount":2000}]`

Specify the [currency](https://paystack.com/docs/api/#supported-currency) of the payment request. Defaults to NGN.

Indicates whether Paystack sends an email notification to customer. Defaults to `true`

Indicate if request should be saved as draft. Defaults to false and overrides send\_notification

Set to `true` to create a draft payment request (adds an auto incrementing payment request number if none is provided) even if there are no `line_items` or `tax` passed

Numeric value of the payment request. Payment Requests will start from 1 and auto increment from there. This field is to help override whatever value Paystack decides. Auto increment for subsequent payment requests continue from this point.

The split code of the transaction split. e.g. `SPL_98WF13Eb3w`

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "description": "a test invoice",6      "line_items": [7        {"name": "item 1", "amount": 20000},8        {"name": "item 2", "amount": 20000}9      ],10      "tax": [11        {"name": "VAT", "amount": 2000}12      ],13      "customer": "CUS_xwaj0txjryg393b",14      "due_date": "2020-07-08"15    }'16
17curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Payment request created",4  "data": {5    "id": 3136406,6    "domain": "test",7    "amount": 42000,8    "currency": "NGN",9    "due_date": "2020-07-08T00:00:00.000Z",10    "has_invoice": true,11    "invoice_number": 1,12    "description": "a test invoice",13    "line_items": [14      {15        "name": "item 1",16        "amount": 2000017      },18      {19        "name": "item 2",20        "amount": 2000021      }22    ],23    "tax": [24      {25        "name": "VAT",26        "amount": 200027      }28    ],29    "request_code": "PRQ_1weqqsn2wwzgft8",30    "status": "pending",31    "paid": false,32    "metadata": null,33    "notifications": [],34    "offline_reference": "4286263136406",35    "customer": 25833615,36    "created_at": "2020-06-29T16:07:33.073Z"37  }38}
```

## List Payment Requests

List the payment requests available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify the page you want to fetch payment requests from. If not specified, we use a default value of 1.

Filter by payment request status

Show archived payment requests

A timestamp from which to start listing payment requests e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing payment requests e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Payment requests retrieved",4  "data": [5    {6      "id": 3136406,7      "domain": "test",8      "amount": 42000,9      "currency": "NGN",10      "due_date": "2020-07-08T00:00:00.000Z",11      "has_invoice": true,12      "invoice_number": 1,13      "description": "a test invoice",14      "pdf_url": null,15      "line_items": [16        {17          "name": "item 1",18          "amount": 2000019        },20        {21          "name": "item 2",22          "amount": 2000023        }24      ],25      "tax": [26        {27          "name": "VAT",28          "amount": 200029        }30      ],31      "request_code": "PRQ_1weqqsn2wwzgft8",32      "status": "pending",33      "paid": false,34      "paid_at": null,35      "metadata": null,36      "notifications": [],37      "offline_reference": "4286263136406",38      "customer": {39        "id": 25833615,40        "first_name": "Damilola",41        "last_name": "Odujoko",42        "email": "damilola@example.com",43        "customer_code": "CUS_xwaj0txjryg393b",44        "phone": null,45        "metadata": {46          "calling_code": "+234"47        },48        "risk_action": "default",49        "international_format_phone": null50      },51      "created_at": "2020-06-29T16:07:33.000Z"52    }53  ],54  "meta": {55    "total": 1,56    "skipped": 0,57    "perPage": 50,58    "page": 1,59    "pageCount": 160  }61}
```

## Fetch Payment Request

Get details of a payment request on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The payment request `ID` or `code` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Payment request retrieved",4  "data": {5    "transactions": [],6    "domain": "test",7    "request_code": "PRQ_1weqqsn2wwzgft8",8    "description": "a test invoice",9    "line_items": [10      {11        "name": "item 1",12        "amount": 2000013      },14      {15        "name": "item 2",16        "amount": 2000017      }18    ],19    "tax": [20      {21        "name": "VAT",22        "amount": 200023      }24    ],25    "amount": 42000,26    "discount": null,27    "currency": "NGN",28    "due_date": "2020-07-08T00:00:00.000Z",29    "status": "pending",30    "paid": false,31    "paid_at": null,32    "metadata": null,33    "has_invoice": true,34    "invoice_number": 1,35    "offline_reference": "4286263136406",36    "pdf_url": null,37    "notifications": [],38    "archived": false,39    "source": "user",40    "payment_method": null,41    "note": null,42    "amount_paid": null,43    "id": 3136406,44    "integration": 428626,45    "customer": {46      "transactions": [],47      "subscriptions": [],48      "authorizations": [],49      "first_name": "Damilola",50      "last_name": "Odujoko",51      "email": "damilola@example.com",52      "phone": null,53      "metadata": {54        "calling_code": "+234"55      },56      "domain": "test",57      "customer_code": "CUS_xwaj0txjryg393b",58      "risk_action": "default",59      "id": 25833615,60      "integration": 428626,61      "createdAt": "2020-06-29T16:06:53.000Z",62      "updatedAt": "2020-06-29T16:06:53.000Z"63    },64    "createdAt": "2020-06-29T16:07:33.000Z",65    "updatedAt": "2020-06-29T16:07:33.000Z",66    "pending_amount": 4200067  }68}
```

## Verify Payment Request

Verify details of a payment request on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest/verify/:code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Payment request retrieved",4  "data": {5    "id": 3136406,6    "domain": "test",7    "amount": 42000,8    "currency": "NGN",9    "due_date": "2020-07-08T00:00:00.000Z",10    "has_invoice": true,11    "invoice_number": 1,12    "description": "a test invoice",13    "pdf_url": null,14    "line_items": [15      {16        "name": "item 1",17        "amount": 2000018      },19      {20        "name": "item 2",21        "amount": 2000022      }23    ],24    "tax": [25      {26        "name": "VAT",27        "amount": 200028      }29    ],30    "request_code": "PRQ_1weqqsn2wwzgft8",31    "status": "pending",32    "paid": false,33    "paid_at": null,34    "metadata": null,35    "notifications": [],36    "offline_reference": "4286263136406",37    "customer": {38      "id": 25833615,39      "first_name": "Damilola",40      "last_name": "Odujoko",41      "email": "damilola@example.com",42      "customer_code": "CUS_xwaj0txjryg393b",43      "phone": null,44      "metadata": {45        "calling_code": "+234"46      },47      "risk_action": "default",48      "international_format_phone": null49    },50    "created_at": "2020-06-29T16:07:33.000Z",51    "integration": {52      "key": "pk_test_xxxxxxxx",53      "name": "Paystack Documentation",54      "logo": "https://s3-eu-west-1.amazonaws.com/pstk-integration-logos/paystack.jpg",55      "allowed_currencies": [56        "NGN",57        "USD"58      ]59    },60    "pending_amount": 4200061  }62}
```

## Send Notification

Send notification of a payment request to your customers

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest/notify/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5
6curl "$url" -H "$authorization" -H "$content_type" -X POST
```

```
1{2  "status": true,3  "message": "Notification sent"4}
```

## Payment Request Total

Get payment requests metric

### Headers

Set value to `Bearer SECRET_KEY`

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest/totals"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization"  -X GET
```

```
1{2  "status": true,3  "message": "Payment request totals",4  "data": {5    "pending": [6      {7        "currency": "NGN",8        "amount": 420009      },10      {11        "currency": "USD",12        "amount": 013      }14    ],15    "successful": [16      {17        "currency": "NGN",18        "amount": 019      },20      {21        "currency": "USD",22        "amount": 023      }24    ],25    "total": [26      {27        "currency": "NGN",28        "amount": 4200029      },30      {31        "currency": "USD",32        "amount": 033      }34    ]35  }36}
```

## Finalize Payment Request

Finalize a draft payment request

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

### Body Parameters

Indicates whether Paystack sends an email notification to customer. Defaults to `true`

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest/finalize/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X POST
```

```
1{2  "status": true,3  "message": "Payment request finalized",4  "data": {5    "id": 3136496,6    "domain": "test",7    "amount": 45000,8    "currency": "NGN",9    "due_date": "2020-06-30T22:59:59.000Z",10    "has_invoice": true,11    "invoice_number": 2,12    "description": "Testing Invoice",13    "pdf_url": null,14    "line_items": [15      {16        "name": "Water",17        "amount": 15000,18        "quantity": 119      },20      {21        "name": "Bread",22        "amount": 30000,23        "quantity": 124      }25    ],26    "tax": [],27    "request_code": "PRQ_rtjkfk1tpmvqo40",28    "status": "pending",29    "paid": false,30    "paid_at": null,31    "metadata": null,32    "notifications": [],33    "offline_reference": "4286263136496",34    "customer": {35      "id": 25833615,36      "first_name": "Damilola",37      "last_name": "Odujoko",38      "email": "damilola@email.com",39      "customer_code": "CUS_xwaj0txjryg393b",40      "phone": null,41      "metadata": {42        "calling_code": "+234"43      },44      "risk_action": "default",45      "international_format_phone": null46    },47    "created_at": "2020-06-29T16:22:35.000Z",48    "pending_amount": 4500049  }50}
```

## Update Payment Request

Update a payment request details on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

Payment Request ID or slug

### Body Parameters

Payment request amount. Only useful if line items and tax values are ignored. endpoint will throw a friendly warning if neither is available.

ISO 8601 representation of request due date

A short description of the payment request

Array of line items int the format `[{"name":"item 1", "amount":2000}]`

Array of taxes to be charged in the format `[{"name":"VAT", "amount":2000}]`

Specify the [currency](https://paystack.com/docs/api/#supported-currency) of the payment request. Defaults to NGN.

Indicates whether Paystack sends an email notification to customer. Defaults to `true`

Indicate if request should be saved as draft. Defaults to false and overrides send\_notification

Numeric value of the payment request. Payment Requests will start from 1 and auto increment from there. This field is to help override whatever value Paystack decides. Auto increment for subsequent payment requests continue from this point.

The split code of the transaction split. e.g. `SPL_98WF13Eb3w`

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "description": "Update test invoice", 7  "due_date": "2017-05-10" 8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Payment request updated",4  "data": {5    "id": 3136496,6    "domain": "test",7    "amount": 45000,8    "currency": "NGN",9    "due_date": "2020-06-30T22:59:59.000Z",10    "has_invoice": true,11    "invoice_number": 2,12    "description": "Update Testing",13    "pdf_url": null,14    "line_items": [15      {16        "name": "Water",17        "amount": 15000,18        "quantity": 119      },20      {21        "name": "Bread",22        "amount": 30000,23        "quantity": 124      }25    ],26    "tax": [],27    "request_code": "PRQ_rtjkfk1tpmvqo40",28    "status": "pending",29    "paid": false,30    "paid_at": null,31    "metadata": null,32    "notifications": [],33    "offline_reference": "4286263136496",34    "customer": {35      "id": 25833615,36      "first_name": "Doc",37      "last_name": "Test",38      "email": "doc@test.com",39      "customer_code": "CUS_xwaj0txjryg393b",40      "phone": null,41      "metadata": {42        "calling_code": "+234"43      },44      "risk_action": "default",45      "international_format_phone": null46    },47    "created_at": "2020-06-29T16:22:35.000Z"48  }49}
```

## Archive Payment Request

Used to archive a payment request. A payment request will no longer be fetched on list or returned on verify

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/paymentrequest/archive/:id_or_code"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5
6curl "$url" -H "$authorization" -H "$content_type" -X POST
```

```
1{2  "status": true,3  "message": "Payment request has been archived"4}
```