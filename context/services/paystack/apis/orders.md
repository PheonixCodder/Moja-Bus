## Orders

The Orders API allows you to create and manage orders for your products.

## Create Order

Create an order for selected items

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

An array of line items. Each item should have `product` (product ID) and `quantity`

```
1#!/bin/sh2url="https://api.paystack.co/order"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "customer": "CUS_abc123def456",7  "line_items": [8    {9      "product": 2196244,10      "quantity": 211    }12  ]13}'14
15curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST16
```

```
1{2  "status": true,3  "message": "Order created",4  "data": {5    "id": 12345,6    "code": "ORD_abc123def456",7    "amount": 20000,8    "currency": "NGN",9    "status": "pending",10    "customer": {11      "id": 297346561,12      "email": "customer@email.com"13    },14    "line_items": [15      {16        "product": {17          "id": 2196244,18          "name": "Sample Product"19        },20        "quantity": 2,21        "amount": 2000022      }23    ],24    "createdAt": "2024-11-01T12:00:00.000Z"25  }26}
```

## List Orders

List the orders available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing orders e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing orders e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/order"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Orders retrieved",4  "data": [5    {6      "id": 12345,7      "code": "ORD_abc123def456",8      "amount": 20000,9      "currency": "NGN",10      "status": "success",11      "customer": {12        "email": "customer@email.com"13      },14      "createdAt": "2024-11-01T12:00:00.000Z"15    }16  ],17  "meta": {18    "total": 1,19    "skipped": 0,20    "perPage": 50,21    "page": 1,22    "pageCount": 123  }24}
```

## Fetch Order

Fetch the details of an order on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The order `ID` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/order/12345"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Order retrieved",4  "data": {5    "id": 12345,6    "code": "ORD_abc123def456",7    "amount": 20000,8    "currency": "NGN",9    "status": "success",10    "customer": {11      "id": 297346561,12      "email": "customer@email.com"13    },14    "line_items": [15      {16        "product": {17          "id": 2196244,18          "name": "Sample Product"19        },20        "quantity": 2,21        "amount": 2000022      }23    ],24    "createdAt": "2024-11-01T12:00:00.000Z"25  }26}
```

## Fetch Product Orders

Fetch all orders for a particular product

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The product `ID` to fetch orders for

```
1#!/bin/sh2url="https://api.paystack.co/order/product/2196244"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Product orders retrieved",4  "data": [5    {6      "id": 12345,7      "code": "ORD_abc123def456",8      "amount": 20000,9      "currency": "NGN",10      "status": "success",11      "customer": {12        "email": "customer@email.com"13      },14      "createdAt": "2024-11-01T12:00:00.000Z"15    }16  ],17  "meta": {18    "total": 1,19    "skipped": 0,20    "perPage": 50,21    "page": 1,22    "pageCount": 123  }24}
```

## Validate Order

Validate a pay for me order

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The order `code` you want to validate

```
1#!/bin/sh2url="https://api.paystack.co/order/ORD_abc123def456/validate"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Order is valid",4  "data": {5    "id": 12345,6    "code": "ORD_abc123def456",7    "amount": 20000,8    "currency": "NGN",9    "status": "pending",10    "valid": true11  }12}
```