# Payment Pages

The Payment Pages API provides a quick and secure way to collect payment for products.

## Create Payment Page

Create a payment page on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

A description for this page

The transaction currency. Defaults to your integration currency.

URL slug you would like to be associated with this page. Page will be accessible at https://paystack.com/pay/\[slug\]

The type of payment page to create. Options are `payment`, `subscription`, `product`, and `plan`. Defaults to `payment` if no type is specified.

The ID of the plan to subscribe customers on this payment page to when `type` is set to `subscription`.

Specifies whether to collect a fixed amount on the payment page. If true, `amount` must be passed.

The split code of the transaction split. e.g. `SPL_98WF13Eb3w`

Extra data to configure the payment page including subaccount, logo image, transaction charge

If you would like Paystack to redirect someplace upon successful payment, specify the URL here.

A success message to display to the customer after a successful transaction

An email address that will receive transaction notifications for this payment page

Specify whether to collect phone numbers on the payment page

If you would like to accept custom fields, specify them here.

```
1#!/bin/sh2url="https://api.paystack.co/page"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6   "name": "Buttercup Brunch", 7   "amount": 500000,8   "description": "Gather your friends for the ritual that is brunch",9}'10
11curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Page created",4  "data": {5    "name": "Onipan and Hassan",6    "description": "",7    "amount": 10000,8    "split_code": "SPL_yqSS1FvrBz",9    "integration": 463433,10    "domain": "test",11    "slug": "1got2y8unp",12    "currency": "NGN",13    "type": "payment",14    "collect_phone": false,15    "active": true,16    "published": true,17    "migrate": false,18    "id": 1308510,19    "createdAt": "2023-03-21T11:44:16.412Z",20    "updatedAt": "2023-03-21T11:44:16.412Z"21  }22}
```

## List Payment Pages

List payment pages available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing page e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing page e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/page"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization"  -X GET
```

```
1{2  "status": true,3  "message": "Pages retrieved",4  "data": [5    {6      "integration": 100073,7      "plan": 1716,8      "domain": "test",9      "name": "Subscribe to plan: Weekly small chops",10      "description": null,11      "amount": null,12      "currency": "NGN",13      "slug": "sR7Ohx2iVd",14      "custom_fields": null,15      "redirect_url": null,16      "active": true,17      "migrate": null,18      "id": 2223,19      "createdAt": "2016-10-01T10:59:11.000Z",20      "updatedAt": "2016-10-01T10:59:11.000Z"21    },22    {23      "integration": 100073,24      "plan": null,25      "domain": "test",26      "name": "Special",27      "description": "Special page",28      "amount": 10000,29      "currency": "NGN",30      "slug": "special-me",31      "custom_fields": [32        {33          "display_name": "Speciality",34          "variable_name": "speciality"35        },36        {37          "display_name": "Age",38          "variable_name": "age"39        }40      ],41      "redirect_url": "http://special.url",42      "active": true,43      "migrate": null,44      "id": 1807,45      "createdAt": "2016-09-09T19:18:37.000Z",46      "updatedAt": "2016-09-14T17:51:49.000Z"47    }48  ],49  "meta": {50    "total": 2,51    "skipped": 0,52    "perPage": "3",53    "page": 1,54    "pageCount": 155  }56}
```

## Fetch Payment Page

Get details of a payment page on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The page `ID` or `slug` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/page/:id_or_slug"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization"  -X GET
```

```
1{2  "status": true,3  "message": "Page retrieved",4  "data": {5    "integration": 100032,6    "domain": "test",7    "name": "Offering collections",8    "description": "Give unto the Lord, and it shall be multiplied ten-fold to you.",9    "amount": null,10    "currency": "NGN",11    "slug": "5nApBwZkvY",12    "active": true,13    "id": 18,14    "createdAt": "2016-03-30T00:49:57.000Z",15    "updatedAt": "2016-03-30T00:49:57.000Z",16    "products": [17      {18        "product_id": 523,19        "name": "Product Four",20        "description": "Product Four Description",21        "product_code": "PROD_l9p81u9pkjqjunb",22        "page": 18,23        "price": 500000,24        "currency": "NGN",25        "quantity": 0,26        "type": "good",27        "features": null,28        "is_shippable": 0,29        "domain": "test",30        "integration": 343288,31        "active": 1,32        "in_stock": 133      },34      {35        "product_id": 522,36        "name": "Product Five",37        "description": "Product Five Description",38        "product_code": "PROD_8ne9cxutagmtsyz",39        "page": 18,40        "price": 500000,41        "currency": "NGN",42        "quantity": 0,43        "type": "good",44        "features": null,45        "is_shippable": 0,46        "domain": "test",47        "integration": 343288,48        "active": 1,49        "in_stock": 050      }51    ]52  }53}
```

## Update Payment Page

Update a payment page details on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

A description for this page

Default amount you want to accept using this page. If none is set, customer is free to provide any amount of their choice. The latter scenario is useful for accepting donations

Set to false to deactivate page url

```
1#!/bin/sh2url="https://api.paystack.co/page/:id_or_slug"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "name": "Buttercup Brunch", 7  "amount": 5000008  "description": "Gather your friends for the ritual that is brunch",9}'10
11curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Page updated",4  "data": {5    "domain": "test",6    "name": "Buttercup Brunch",7    "description": "Gather your friends for the ritual that is brunch",8    "amount": null,9    "currency": "NGN",10    "slug": "5nApBwZkvY",11    "active": true,12    "id": 18,13    "integration": 100032,14    "createdAt": "2016-03-30T00:49:57.000Z",15    "updatedAt": "2016-03-30T04:44:35.000Z"16  }17}
```

## Check Slug Availability

Check the availability of a slug for a payment page

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

```
1#!/bin/sh2url="https://api.paystack.co/page/check_slug_availability/:slug"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Slug is available"4}
```

## Add Products

Add products to a payment page

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

```
1#!/bin/sh2url="https://api.paystack.co/page/:id/product"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "product": [473, 292] }'6
7
8curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Products added to page",4  "data": {5    "integration": 343288,6    "plan": null,7    "domain": "test",8    "name": "Demo Products Page",9    "description": "Demo Products Page",10    "amount": null,11    "currency": "NGN",12    "slug": "demoproductspage",13    "custom_fields": [],14    "type": "product",15    "redirect_url": null,16    "success_message": null,17    "collect_phone": false,18    "active": true,19    "published": true,20    "migrate": true,21    "notification_email": null,22    "metadata": {},23    "id": 102859,24    "createdAt": "2019-06-29T16:21:24.000Z",25    "updatedAt": "2019-06-29T16:28:11.000Z",26    "products": [27      {28        "product_id": 523,29        "name": "Product Four",30        "description": "Product Four Description",31        "product_code": "PROD_l9p81u9pkjqjunb",32        "page": 102859,33        "price": 500000,34        "currency": "NGN",35        "quantity": 0,36        "type": "good",37        "features": null,38        "is_shippable": 0,39        "domain": "test",40        "integration": 343288,41        "active": 1,42        "in_stock": 143      }44    ]45  }46}
```