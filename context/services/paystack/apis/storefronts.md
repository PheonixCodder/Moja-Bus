## Storefronts

The Storefronts API allows you to create and manage digital shops to display and sell your products.

## Create Storefront

Create a digital shop to manage and display your products

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

URL slug for the storefront. Must be unique

A description for this storefront

```
1#!/bin/sh2url="https://api.paystack.co/storefront"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "name": "My Storefront",7  "slug": "my-storefront",8  "description": "A description of my storefront"9}'10
11curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST12
```

```
1{2  "status": true,3  "message": "Storefront created",4  "data": {5    "id": 1559046,6    "name": "My Storefront",7    "slug": "my-storefront",8    "description": "A description of my storefront",9    "status": "inactive",10    "currency": "NGN",11    "createdAt": "2024-11-01T12:00:00.000Z",12    "updatedAt": "2024-11-01T12:00:00.000Z"13  }14}
```

## List Storefronts

List the storefronts available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

Filter by storefront status. Value can be `active` or `inactive`

```
1#!/bin/sh2url="https://api.paystack.co/storefront"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Storefronts retrieved",4  "data": [5    {6      "id": 1559046,7      "name": "My Storefront",8      "slug": "my-storefront",9      "description": "A description of my storefront",10      "status": "active",11      "currency": "NGN",12      "createdAt": "2024-11-01T12:00:00.000Z",13      "updatedAt": "2024-11-01T12:00:00.000Z"14    }15  ],16  "meta": {17    "total": 1,18    "skipped": 0,19    "perPage": 50,20    "page": 1,21    "pageCount": 122  }23}
```

## Fetch Storefront

Get the details of a storefront on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The storefront `ID` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/storefront/1559046"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Storefront retrieved",4  "data": {5    "id": 1559046,6    "name": "My Storefront",7    "slug": "my-storefront",8    "description": "A description of my storefront",9    "status": "active",10    "currency": "NGN",11    "createdAt": "2024-11-01T12:00:00.000Z",12    "updatedAt": "2024-11-01T12:00:00.000Z"13  }14}
```

## Update Storefront

Update the details of a storefront on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

The storefront `ID` you want to update

### Body Parameters

A description for this storefront

```
1#!/bin/sh2url="https://api.paystack.co/storefront/1559046"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "name": "Updated Storefront Name",7  "description": "An updated description"8}'9
10curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT11
```

```
1{2  "status": true,3  "message": "Storefront updated",4  "data": {5    "id": 1559046,6    "name": "Updated Storefront Name",7    "slug": "my-storefront",8    "description": "An updated description",9    "status": "active",10    "currency": "NGN",11    "createdAt": "2024-11-01T12:00:00.000Z",12    "updatedAt": "2024-11-01T14:00:00.000Z"13  }14}
```

## Delete Storefront

Delete a storefront on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The storefront `ID` you want to delete

```
1#!/bin/sh2url="https://api.paystack.co/storefront/1559046"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X DELETE6
```

```
1{2  "status": true,3  "message": "Storefront deleted"4}
```

## Verify Storefront Slug

Verify the availability of a slug before using it for your storefront

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The slug you want to verify

```
1#!/bin/sh2url="https://api.paystack.co/storefront/verify/my-storefront"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Slug is available"4}
```

## Fetch Storefront Orders

Fetch all orders in your storefront

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/storefront/1559046/order"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Orders retrieved",4  "data": [5    {6      "id": 12345,7      "code": "ORD_abc123def456",8      "amount": 50000,9      "currency": "NGN",10      "status": "success",11      "customer": {12        "email": "customer@email.com"13      },14      "createdAt": "2024-11-01T12:00:00.000Z"15    }16  ],17  "meta": {18    "total": 1,19    "skipped": 0,20    "perPage": 50,21    "page": 1,22    "pageCount": 123  }24}
```

## Add Products to Storefront

Add previously created products to a storefront

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

An array of product IDs to add to the storefront

```
1#!/bin/sh2url="https://api.paystack.co/storefront/1559046/product"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "products": [2196244, 2196245]7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST10
```

```
1{2  "status": true,3  "message": "Products added to storefront"4}
```

## List Storefront Products

List the products in a storefront

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/storefront/1559046/product"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET6
```

```
1{2  "status": true,3  "message": "Products retrieved",4  "data": [5    {6      "id": 2196244,7      "name": "Sample Product",8      "description": "A sample product",9      "price": 10000,10      "currency": "NGN",11      "active": true12    }13  ],14  "meta": {15    "total": 1,16    "skipped": 0,17    "perPage": 50,18    "page": 1,19    "pageCount": 120  }21}
```

## Publish Storefront

Make your storefront publicly available

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The storefront `ID` you want to publish

```
1#!/bin/sh2url="https://api.paystack.co/storefront/1559046/publish"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X POST6
```

```
1{2  "status": true,3  "message": "Storefront published"4}
```

## Duplicate Storefront

Duplicate a previously created storefront

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The storefront `ID` you want to duplicate

```
1#!/bin/sh2url="https://api.paystack.co/storefront/1559046/duplicate"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X POST6
```

```
1{2  "status": true,3  "message": "Storefront duplicated"4}
```