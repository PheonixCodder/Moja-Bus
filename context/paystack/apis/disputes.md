## Disputes

The Disputes API allows you manage transaction disputes on your integration.

## List Disputes

List disputes filed against you

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

A timestamp from which to start listing dispute e.g. `2016-09-21`

A timestamp at which to stop listing dispute e.g. `2016-09-21`

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what dispute you want to page. If not specified, we use a default value of 1.

Dispute Status. Acceptable values: { awaiting-merchant-feedback | awaiting-bank-feedback | pending | resolved }

```
1#!/bin/sh2url="https://api.paystack.co/dispute"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Disputes retrieved",4  "data": [5    {6      "id": 2867,7      "refund_amount": null,8      "currency": null,9      "status": "archived",10      "resolution": null,11      "domain": "test",12      "transaction": {13        "id": 5991760,14        "domain": "test",15        "status": "success",16        "reference": "asjck8gf76zd1dr",17        "amount": 39100,18        "message": null,19        "gateway_response": "Successful",20        "paid_at": "2017-11-09T00:01:56.000Z",21        "created_at": "2017-11-09T00:01:36.000Z",22        "channel": "card",23        "currency": "NGN",24        "ip_address": null,25        "metadata": "",26        "log": null,27        "fees": 587,28        "fees_split": null,29        "authorization": {},30        "customer": null,31        "plan": {},32        "subaccount": {},33        "split": {},34        "order_id": null,35        "paidAt": "2017-11-09T00:01:56.000Z",36        "createdAt": "2017-11-09T00:01:36.000Z",37        "pos_transaction_data": null38      },39      "transaction_reference": null,40      "category": null,41      "customer": {42        "id": 10207,43        "first_name": null,44        "last_name": null,45        "email": "shola@baddest.com",46        "customer_code": "CUS_unz4q52yjsd6064",47        "phone": null,48        "metadata": null,49        "risk_action": "default",50        "international_format_phone": null51      },52      "bin": null,53      "last4": null,54      "dueAt": null,55      "resolvedAt": null,56      "evidence": null,57      "attachments": "[]",58      "note": null,59      "history": [60        {61          "status": "pending",62          "by": "demo@test.co",63          "createdAt": "2017-11-16T16:12:24.000Z"64        }65      ],66      "messages": [67        {68          "sender": "demo@test.co",69          "body": "test this",70          "createdAt": "2017-11-16T16:12:24.000Z"71        }72      ],73      "createdAt": "2017-11-16T16:12:24.000Z",74      "updatedAt": "2019-08-16T08:05:25.000Z"75    }76  ],77  "meta": {78    "total": 1,79    "skipped": 0,80    "perPage": 50,81    "page": 1,82    "pageCount": 183  }84}
```

## Fetch Dispute

Get more details about a dispute.

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The dispute `ID` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/dispute/:id"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Dispute retrieved",4  "data": {5    "id": 2867,6    "refund_amount": null,7    "currency": null,8    "status": "archived",9    "resolution": null,10    "domain": "test",11    "transaction": {12      "id": 5991760,13      "domain": "test",14      "status": "success",15      "reference": "asjck8gf76zd1dr",16      "amount": 39100,17      "message": null,18      "gateway_response": "Successful",19      "paid_at": "2017-11-09T00:01:56.000Z",20      "created_at": "2017-11-09T00:01:36.000Z",21      "channel": "card",22      "currency": "NGN",23      "ip_address": null,24      "metadata": "",25      "log": null,26      "fees": 587,27      "fees_split": null,28      "authorization": {},29      "customer": {30        "international_format_phone": null31      },32      "plan": {},33      "subaccount": {},34      "split": {},35      "order_id": null,36      "paidAt": "2017-11-09T00:01:56.000Z",37      "createdAt": "2017-11-09T00:01:36.000Z",38      "requested_amount": null39    },40    "transaction_reference": null,41    "category": null,42    "customer": {43      "id": 10207,44      "first_name": null,45      "last_name": null,46      "email": "shola@baddest.com",47      "customer_code": "CUS_unz4q52yjsd6064",48      "phone": null,49      "metadata": null,50      "risk_action": "default",51      "international_format_phone": null52    },53    "bin": null,54    "last4": null,55    "dueAt": null,56    "resolvedAt": null,57    "evidence": null,58    "attachments": "[]",59    "note": null,60    "history": [61      {62        "status": "pending",63        "by": "demo@test.co",64        "createdAt": "2017-11-16T16:12:24.000Z"65      }66    ],67    "messages": [68      {69        "sender": "demo@test.co",70        "body": "test this",71        "createdAt": "2017-11-16T16:12:24.000Z"72      }73    ],74    "createdAt": "2017-11-16T16:12:24.000Z",75    "updatedAt": "2019-08-16T08:05:25.000Z"76  }77}
```

## List Transaction Disputes

This endpoint retrieves disputes for a particular transaction

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The transaction `ID` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/dispute/transaction/:id"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Dispute retrieved successfully",4  "data": {5    "history": [6      {7        "id": 6094,8        "dispute": 2867,9        "status": "pending",10        "by": "demo@test.co",11        "createdAt": "2017-11-16T16:12:24.000Z",12        "updatedAt": "2017-11-16T16:12:24.000Z"13      }14    ],15    "messages": [16      {17        "sender": "demo@test.co",18        "body": "test this",19        "dispute": 2867,20        "id": 148,21        "is_deleted": 0,22        "createdAt": "2017-11-16T16:12:24.000Z",23        "updatedAt": "2017-11-16T16:12:24.000Z"24      }25    ],26    "currency": null,27    "last4": null,28    "bin": null,29    "transaction_reference": null,30    "merchant_transaction_reference": null,31    "refund_amount": null,32    "status": "archived",33    "domain": "test",34    "resolution": null,35    "category": null,36    "note": null,37    "attachments": "[]",38    "id": 2867,39    "integration": 100043,40    "transaction": {41      "id": 5991760,42      "domain": "test",43      "status": "success",44      "reference": "asjck8gf76zd1dr",45      "amount": 39100,46      "message": null,47      "gateway_response": "Successful",48      "paid_at": "2017-11-09T00:01:56.000Z",49      "created_at": "2017-11-09T00:01:36.000Z",50      "channel": "card",51      "currency": "NGN",52      "ip_address": null,53      "metadata": "",54      "log": null,55      "fees": 587,56      "fees_split": null,57      "authorization": {},58      "customer": {59        "international_format_phone": null60      },61      "plan": {},62      "subaccount": {},63      "split": {},64      "order_id": null,65      "paidAt": "2017-11-09T00:01:56.000Z",66      "createdAt": "2017-11-09T00:01:36.000Z",67      "requested_amount": null68    },69    "created_by": null,70    "evidence": null,71    "resolvedAt": null,72    "createdAt": "2017-11-16T16:12:24.000Z",73    "updatedAt": "2019-08-16T08:05:25.000Z",74    "dueAt": null75  }76}
```

## Update Dispute

Update details of a dispute on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

filename of attachment returned via response from upload url(GET /dispute/:id/upload\_url)

```
1#!/bin/sh2url="https://api.paystack.co/dispute/:id"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "refund_amount": 1002 }'6
7curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Dispute updated successfully",4  "data": [5    {6      "currency": "NGN",7      "last4": null,8      "bin": null,9      "transaction_reference": null,10      "merchant_transaction_reference": null,11      "refund_amount": 1002,12      "status": "resolved",13      "domain": "test",14      "resolution": "merchant-accepted",15      "source": "bank",16      "category": "general",17      "note": null,18      "attachments": "attachement",19      "id": 624,20      "transaction": {21        "id": 5991760,22        "domain": "test",23        "status": "success",24        "reference": "asjck8gf76zd1dr",25        "amount": 39100,26        "message": null,27        "gateway_response": "Successful",28        "paid_at": "2017-11-09T00:01:56.000Z",29        "created_at": "2017-11-09T00:01:36.000Z",30        "channel": "card",31        "currency": "NGN",32        "ip_address": null,33        "metadata": "",34        "log": null,35        "fees": 587,36        "fees_split": null,37        "authorization": {},38        "customer": {39          "international_format_phone": null40        },41        "plan": {},42        "subaccount": {},43        "split": {},44        "order_id": null,45        "paidAt": "2017-11-09T00:01:56.000Z",46        "createdAt": "2017-11-09T00:01:36.000Z",47        "requested_amount": null48      },49      "customer": {50        "id": 10207,51        "first_name": null,52        "last_name": null,53        "email": "shola@baddest.com",54        "customer_code": "CUS_unz4q52yjsd6064",55        "phone": null,56        "metadata": null,57        "risk_action": "default",58        "international_format_phone": null59      },60      "organization": 1,61      "evidence": null,62      "resolvedAt": "2019-08-28T14:14:41.000Z",63      "createdAt": "2019-08-28T14:14:41.000Z",64      "updatedAt": "2019-08-28T14:29:07.000Z",65      "dueAt": null66    }67  ]68}
```

## Add Evidence

Provide evidence for a dispute

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Details of service involved

ISO 8601 representation of delivery date (YYYY-MM-DD)

```
1#!/bin/sh2url="https://api.paystack.co/dispute/:id/evidence"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "customer_email": "cus@gmail.com",6      "customer_name": "Mensah King",7      "customer_phone": "0802345167",8      "service_details": "claim for buying product",9      "delivery_address": "3a ladoke street ogbomoso"10    }'11
12curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Evidence created",4  "data": {5    "customer_email": "cus@gmail.com",6    "customer_name": "Mensah King",7    "customer_phone": "0802345167",8    "service_details": "claim for buying product",9    "delivery_address": "3a ladoke street ogbomoso",10    "dispute": 624,11    "id": 21,12    "createdAt": "2019-08-28T15:36:13.783Z",13    "updatedAt": "2019-08-28T15:39:39.153Z"14  }15}
```

## Get Upload URL

This endpoint retrieves disputes for a particular transaction

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

### Query Parameters

The file name, with its extension, that you want to upload. e.g `filename.pdf`

```
1#!/bin/sh2url="https://api.paystack.co/dispute/:id/upload_url?upload_filename=filename.ext"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Upload url generated",4  "data": {5    "signedUrl": "https://s3.eu-west-1.amazonaws.com/files.paystack.co/qesp8a4df1xejihd9x5q?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAI7CL5IZL2DJHOPPA%2F20191009%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20191009T220931Z&X-Amz-Expires=1800&X-Amz-Signature=f5cc387949f3520982886e70ab2e08721a82a9fa9e26b696b91471f36453867a&X-Amz-SignedHeaders=host",6    "fileName": "qesp8a4df1xejihd9x5q"7  }8}
```

## Resolve Dispute

Resolve a dispute on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

Dispute resolution. Accepted values: { merchant-accepted | declined }.

filename of attachment returned via response from upload url(GET /dispute/:id/upload\_url)

Evidence Id for fraud claims

```
1#!/bin/sh2url="https://api.paystack.co/dispute/:id/resolve"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "resolution": "merchant-accepted",6        "message": "Merchant accepted", 7        "uploaded_filename": "qesp8a4df1xejihd9x5q", 8        "refund_amount": 1002 9     }'10
11curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Dispute successfully resolved",4  "data": {5    "currency": "NGN",6    "last4": null,7    "bin": null,8    "transaction_reference": null,9    "merchant_transaction_reference": null,10    "refund_amount": 1002,11    "status": "resolved",12    "domain": "test",13    "resolution": "merchant-accepted",14    "category": "general",15    "note": null,16    "attachments": "attachment",17    "id": 624,18    "transaction": {19      "id": 5991760,20      "domain": "test",21      "status": "success",22      "reference": "asjck8gf76zd1dr",23      "amount": 39100,24      "message": null,25      "gateway_response": "Successful",26      "paid_at": "2017-11-09T00:01:56.000Z",27      "created_at": "2017-11-09T00:01:36.000Z",28      "channel": "card",29      "currency": "NGN",30      "ip_address": null,31      "metadata": "",32      "log": null,33      "fees": 587,34      "fees_split": null,35      "authorization": {},36      "customer": {37        "international_format_phone": null38      },39      "plan": {},40      "subaccount": {},41      "split": {},42      "order_id": null,43      "paidAt": "2017-11-09T00:01:56.000Z",44      "createdAt": "2017-11-09T00:01:36.000Z",45      "requested_amount": null46    },47    "created_by": 30,48    "evidence": null,49    "resolvedAt": "2019-08-28T15:23:31.000Z",50    "createdAt": "2019-08-28T14:14:41.000Z",51    "updatedAt": "2019-08-28T15:23:31.000Z",52    "dueAt": null,53    "message": {54      "dispute": 624,55      "sender": "demo@test.co",56      "body": "Merchant accepted",57      "id": 718,58      "createdAt": "2019-08-28T15:23:31.418Z",59      "updatedAt": "2019-08-28T15:23:31.418Z"60    }61  }62}
```

## Export Disputes

Export disputes available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

A timestamp from which to start listing dispute e.g. `2016-09-21`

A timestamp at which to stop listing dispute e.g. `2016-09-21`

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what dispute you want to page. If not specified, we use a default value of 1.

Dispute Status. Acceptable values: { awaiting-merchant-feedback | awaiting-bank-feedback | pending | resolved }

```
1#!/bin/sh2url="https://api.paystack.co/dispute/export"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Export successful",4  "data": {5    "path": "https://s3.eu-west-1.amazonaws.com/files.paystack.co/exports/100043/disputes/161834548008.csv?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIFGL5IZL2DJHOPPA%2F20210419%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20210419T115718Z&X-Amz-Expires=60&X-Amz-Signature=8fc02bdf7f12411a6505559b4c35b069a8a478295b98c0587907777ef5e31bda&X-Amz-SignedHeaders=host",6    "expiresAt": "2021-04-19 11:58:18"7  }8}
```