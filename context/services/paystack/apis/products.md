## Products

The Products API allows you create and manage inventories on your integration.

## Create Product

Create a product on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

A description for this product

Set to `true` if the product has unlimited stock. Leave as `false` if the product has limited stock

Number of products in stock. Use if `unlimited` is `false`

```
1#!/bin/sh2url="https://api.paystack.co/product"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "name": "Puff Puff",7  "description": "Crispy flour ball with fluffy interior",8  "price": "5000",9  "currency": "NGN",10  "unlimited": false,11  "quantity": 10012}'13
14curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Product successfully created",4  "data": {5    "name": "Puff Puff",6    "description": "Crispy flour ball with fluffy interior",7    "currency": "NGN",8    "price": 5000,9    "quantity": 100,10    "is_shippable": true,11    "unlimited": false,12    "integration": 463433,13    "domain": "test",14    "metadata": {15      "background_color": "#F5F5F5"16    },17    "slug": "puff-puff-prqnxc",18    "product_code": "PROD_ddot3upakgl3ejt",19    "quantity_sold": 0,20    "type": "good",21    "shipping_fields": {22      "delivery_note": "disabled"23    },24    "active": true,25    "in_stock": true,26    "minimum_orderable": 1,27    "maximum_orderable": null,28    "low_stock_alert": false,29    "id": 489399,30    "createdAt": "2021-11-08T14:39:37.303Z",31    "updatedAt": "2021-11-08T14:39:37.303Z"32  }33}
```

## List Products

List products available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing product e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing product e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/product"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Products retrieved",4  "data": [5    {6      "id": 795638,7      "name": "Mimshack",8      "description": "Everything cars",9      "product_code": "PROD_22deobcvbht2dfe",10      "slug": "mimshack-yiuedh",11      "currency": "NGN",12      "price": 50000,13      "quantity": 10,14      "quantity_sold": 0,15      "active": true,16      "domain": "test",17      "type": "good",18      "in_stock": true,19      "unlimited": false,20      "metadata": {21        "background_color": "#F5F5F5"22      },23      "files": [],24      "success_message": null,25      "redirect_url": null,26      "split_code": null,27      "notification_emails": null,28      "minimum_orderable": 1,29      "maximum_orderable": null,30      "createdAt": "2022-04-12T11:21:43.000Z",31      "updatedAt": "2022-04-12T11:21:43.000Z",32      "digital_assets": [],33      "variant_options": [],34      "is_shippable": true,35      "shipping_fields": {36        "delivery_note": "disabled"37      },38      "integration": 463433,39      "low_stock_alert": 040    },41    {42      "id": 682324,43      "name": "Nike Air 23",44      "description": "Just do it!",45      "product_code": "PROD_4vg503b3qga3vul",46      "slug": "nike-air-23-gylbao",47      "currency": "NGN",48      "price": 25000000,49      "quantity": 7,50      "quantity_sold": 0,51      "active": true,52      "domain": "test",53      "type": "good",54      "in_stock": true,55      "unlimited": false,56      "metadata": {57        "background_color": "#05090b"58      },59      "files": [60        {61          "key": "products/2eppxpcv5mqdulp7l410.jpeg",62          "type": "image",63          "path": "https://res.cloudinary.com/paystack/image/upload/public/files/products/2eppxpcv5mqdulp7l410.jpeg",64          "original_filename": "download.jpeg"65        }66      ],67      "success_message": "Thanks for your order",68      "redirect_url": "https://nike.com",69      "split_code": null,70      "notification_emails": null,71      "minimum_orderable": 1,72      "maximum_orderable": null,73      "createdAt": "2022-03-02T11:48:09.000Z",74      "updatedAt": "2022-03-02T11:50:57.000Z",75      "digital_assets": [],76      "variant_options": [],77      "is_shippable": true,78      "shipping_fields": {79        "delivery_note": "optional",80        "shipping_fees": [81          {82            "region": "Ikeja",83            "fee": 100000,84            "currency": "NGN"85          },86          {87            "region": "Yaba",88            "fee": 150000,89            "currency": "NGN"90          },91          {92            "region": "Rest of Lagos",93            "fee": 300000,94            "currency": "NGN"95          }96        ]97      },98      "integration": 463433,99      "low_stock_alert": 0100    },101    {102      "id": 489399,103      "name": "Puff Puff",104      "description": "Crispy flour ball with fluffy interior",105      "product_code": "PROD_ddot3upakgl3ejt",106      "slug": "puff-puff-prqnxc",107      "currency": "NGN",108      "price": 5000,109      "quantity": 100,110      "quantity_sold": 0,111      "active": true,112      "domain": "test",113      "type": "good",114      "in_stock": true,115      "unlimited": false,116      "metadata": {117        "background_color": "#F5F5F5"118      },119      "files": [],120      "success_message": null,121      "redirect_url": null,122      "split_code": null,123      "notification_emails": null,124      "minimum_orderable": 1,125      "maximum_orderable": null,126      "createdAt": "2021-11-08T14:39:37.000Z",127      "updatedAt": "2021-11-08T14:39:37.000Z",128      "digital_assets": [],129      "variant_options": [],130      "is_shippable": true,131      "shipping_fields": {132        "delivery_note": "disabled"133      },134      "integration": 463433,135      "low_stock_alert": 0136    }137  ],138  "meta": {139    "total": 3,140    "skipped": 0,141    "perPage": 50,142    "page": 1,143    "pageCount": 1144  }145}
```

## Fetch Product

Get details of a product on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The product `ID` you want to fetch

```
1#!/bin/sh2url="https://api.paystack.co/product/:id"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Product retrieved",4  "data": {5    "digital_assets": [],6    "integration": 463433,7    "name": "Mimshack",8    "description": "Everything cars",9    "product_code": "PROD_22deobcvbht2dfe",10    "price": 50000,11    "currency": "NGN",12    "quantity": 10,13    "quantity_sold": null,14    "type": "good",15    "files": null,16    "file_path": null,17    "is_shippable": true,18    "shipping_fields": {19      "delivery_note": "disabled"20    },21    "unlimited": false,22    "domain": "test",23    "active": true,24    "features": null,25    "in_stock": true,26    "metadata": {27      "background_color": "#F5F5F5"28    },29    "slug": "mimshack-yiuedh",30    "success_message": null,31    "redirect_url": null,32    "split_code": null,33    "notification_emails": null,34    "minimum_orderable": 1,35    "maximum_orderable": null,36    "low_stock_alert": false,37    "stock_threshold": null,38    "expires_in": null,39    "id": 795638,40    "createdAt": "2022-04-12T11:21:43.000Z",41    "updatedAt": "2022-04-12T11:21:43.000Z"42  }43}
```

## Update Product

Update a product details on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

### Body Parameters

A description for this product

Set to `true` if the product has unlimited stock. Leave as `false` if the product has limited stock

Number of products in stock. Use if `unlimited` is `false`

```
1#!/bin/sh2url="https://api.paystack.co/product/:id"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "description": "Product Six Description", 7  "name": "Product Six",8  "price": 500000, 9  "currency": "USD", 10  "limited": false, 11  "quantity": 100 12}'13
14curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Product successfully updated",4  "data": {5    "name": "Prod One",6    "description": "Prod 1",7    "product_code": "PROD_ohc0xq1ajpt2271",8    "price": 20000,9    "currency": "NGN",10    "quantity": 5,11    "quantity_sold": null,12    "type": "good",13    "image_path": "",14    "file_path": "",15    "is_shippable": false,16    "unlimited": false,17    "domain": "test",18    "active": true,19    "features": null,20    "in_stock": true,21    "metadata": null,22    "id": 526,23    "integration": 343288,24    "createdAt": "2019-06-29T14:46:52.000Z",25    "updatedAt": "2019-06-29T15:29:21.000Z"26  }27}
```