# Miscellaneous
The Miscellaneous API are supporting APIs that can be used to provide more details to other APIs.

## List Banks

Get a list of all supported banks and their properties

### Query Parameters

The country from which to obtain the list of supported banks. Accepted values are: `ghana`, `kenya`, `nigeria`, `south africa`

Flag to enable cursor pagination on the endpoint

The number of objects to return per page. Defaults to 50, and limited to 100 records per page.

A flag to filter for available banks a customer can make a transfer to complete a payment

A flag to filter for banks a customer can pay directly from

A flag to filter the banks that are supported for account verification in South Africa. You need to combine this with either the `currency` or `country` filter.

A cursor that indicates your place in the list. It can be used to fetch the next page of the list

A cursor that indicates your place in the list. It should be used to fetch the previous page of the list after an intial next request

The gateway type of the bank. It can be one of these: \[emandate, digitalbankmandate\]

Type of financial channel. For Ghanaian channels, please use either **mobile\_money** for mobile money channels OR **ghipss** for bank channels

A flag that returns Nigerian banks with their `nip institution code`. The returned value can be used in identifying institutions on NIP.

```
1#!/bin/sh2url="https://api.paystack.co/bank"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Banks retrieved",4  "data": [5    {6      "name": "Abbey Mortgage Bank",7      "slug": "abbey-mortgage-bank",8      "code": "801",9      "longcode": "",10      "gateway": null,11      "pay_with_bank": false,12      "active": true,13      "is_deleted": false,14      "country": "Nigeria",15      "currency": "NGN",16      "type": "nuban",17      "id": 174,18      "createdAt": "2020-12-07T16:19:09.000Z",19      "updatedAt": "2020-12-07T16:19:19.000Z"20    },21    {22      "name": "Coronation Merchant Bank",23      "slug": "coronation-merchant-bank",24      "code": "559",25      "longcode": "",26      "gateway": null,27      "pay_with_bank": false,28      "active": true,29      "is_deleted": false,30      "country": "Nigeria",31      "currency": "NGN",32      "type": "nuban",33      "id": 173,34      "createdAt": "2020-11-24T10:25:07.000Z",35      "updatedAt": "2020-11-24T10:25:07.000Z"36    },37    {38      "name": "Infinity MFB",39      "slug": "infinity-mfb",40      "code": "50457",41      "longcode": "",42      "gateway": null,43      "pay_with_bank": false,44      "active": true,45      "is_deleted": false,46      "country": "Nigeria",47      "currency": "NGN",48      "type": "nuban",49      "id": 172,50      "createdAt": "2020-11-24T10:23:37.000Z",51      "updatedAt": "2020-11-24T10:23:37.000Z"52    },53    {54      "name": "Paycom",55      "slug": "paycom",56      "code": "999992",57      "longcode": "",58      "gateway": null,59      "pay_with_bank": false,60      "active": true,61      "is_deleted": false,62      "country": "Nigeria",63      "currency": "NGN",64      "type": "nuban",65      "id": 171,66      "createdAt": "2020-11-24T10:20:45.000Z",67      "updatedAt": "2020-11-24T10:20:54.000Z"68    },69    {70      "name": "Petra Mircofinance Bank Plc",71      "slug": "petra-microfinance-bank-plc",72      "code": "50746",73      "longcode": "",74      "gateway": null,75      "pay_with_bank": false,76      "active": true,77      "is_deleted": false,78      "country": "Nigeria",79      "currency": "NGN",80      "type": "nuban",81      "id": 170,82      "createdAt": "2020-11-24T10:03:06.000Z",83      "updatedAt": "2020-11-24T10:03:06.000Z"84    }85  ],86  "meta": {87    "next": "YmFuazoxNjk=",88    "previous": null,89    "perPage": 590  }91}
```

## List Countries

Gets a list of countries that Paystack currently supports

```
1#!/bin/sh2url="https://api.paystack.co/country"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Countries retrieved",4  "data": [5    {6      "id": 1,7      "name": "Nigeria",8      "iso_code": "NG",9      "default_currency_code": "NGN",10      "integration_defaults": {},11      "relationships": {12        "currency": {13          "type": "currency",14          "data": [15            "NGN",16            "USD"17          ]18        },19        "integration_feature": {20          "type": "integration_feature",21          "data": []22        },23        "integration_type": {24          "type": "integration_type",25          "data": [26            "ITYPE_001",27            "ITYPE_002",28            "ITYPE_003"29          ]30        },31        "payment_method": {32          "type": "payment_method",33          "data": [34            "PAYM_001",35            "PAYM_002",36            "PAYM_003",37            "PAYM_004"38          ]39        }40      }41    },42    {43      "id": 2,44      "name": "Ghana",45      "iso_code": "GH",46      "default_currency_code": "GHS",47      "integration_defaults": {},48      "relationships": {49        "currency": {50          "type": "currency",51          "data": [52            "GHS",53            "USD"54          ]55        },56        "integration_feature": {57          "type": "integration_feature",58          "data": []59        },60        "integration_type": {61          "type": "integration_type",62          "data": [63            "ITYPE_004",64            "ITYPE_005"65          ]66        },67        "payment_method": {68          "type": "payment_method",69          "data": [70            "PAYM_001"71          ]72        }73      }74    }75  ]76}
```

## List States (AVS)

Get a list of states for a country for address verification

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

The country code of the states to list. Accepted values are: `US`, `CA`, `GB`

```
1#!/bin/sh2url="https://api.paystack.co/address_verification/states?country=CA"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "States retrieved",4  "data": [5    {6      "name": "Alberta",7      "slug": "alberta",8      "abbreviation": "AB"9    },10    {11      "name": "British Columbia",12      "slug": "british-columbia",13      "abbreviation": "BC"14    }15  ]16}
```