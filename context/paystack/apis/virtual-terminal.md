# Virtual Terminal

The Virtual Terminal API allows you to accept in-person payments without a POS device.

## Create Virtual Terminal

Create a Virtual Terminal on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Name of the Virtual Terminal

An array of objects containing the notification recipients for payments to the Virtual Terminal. Each object includes a `target` parameter for the Whatsapp phone number to send notifications to, and a `name` parameter for a descriptive label.

Stringified JSON object of custom data. Kindly check the Metadata page for more information

The transaction currency for the Virtual Terminal. Defaults to your integration currency

An array of objects representing custom fields to display on the form. Each object contains a `display_name` parameter, representing what will be displayed on the Virtual Terminal page, and `variable_name` parameter for referencing the custom field programmatically

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal"3authorization="Authorization: Bearer SECRET_KEY"4content_type="Content-Type: application/json"5data='{6"name": "Sample Terminal",7"destinations": [8    {9    "target": "+27639022319",10    "name": "Phone Destination"11    }12]13}'14
15curl "$url" -H "$authorization" -H "$content_type" -X POST -d "$data"16
17
```

```
1{2  "status": true,3  "message": "Virtual Terminal created",4  "data": {5    "id": 27691,6    "name": "Sample Terminal",7    "integration": 530700,8    "domain": "test",9    "code": "VT_LJK5892Z",10    "paymentMethods": [],11    "active": true,12    "metadata": null,13    "destinations": [14      {15        "target": "+27639022319",16        "type": "whatsapp",17        "name": "Phone Destination"18      }19    ],20    "currency": "ZAR"21  }22}
```

## List Virtual Terminals

List Virtual Terminals on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Filter by status ('active' or 'inactive')

Number of records per page

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal"3authorization="Authorization: Bearer SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Virtual Terminals retrieved",4  "data": [5    {6      "id": 26740,7      "code": "VT_SOUAPKJZ",8      "name": "Sales Point #3",9      "integration": 530790,10      "domain": "test",11      "paymentMethods": [],12      "active": true,13      "created_at": "2025-01-16T14:09:11.000Z",14      "currency": "ZAR"15    },16    {17      "id": 26592,18      "code": "VT_NG3LPU2I",19      "name": "Sales Point #4",20      "integration": 530790,21      "domain": "test",22      "paymentMethods": [],23      "active": true,24      "created_at": "2025-01-14T16:35:58.000Z",25      "currency": "ZAR"26    }27  ],28  "meta": {29    "next": null,30    "previous": null,31    "perPage": 5032  }33}
```

## Fetch Virtual Terminal

Fetch a Virtual Terminal on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

Code of the Virtual Terminal

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal/:code"3authorization="Authorization: Bearer SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Virtual Terminal retrieved",4  "data": {5    "id": 27691,6    "code": "VT_MCK5292Z",7    "name": "Sample Terminal",8    "integration": 730720,9    "domain": "test",10    "paymentMethods": [],11    "active": true,12    "created_at": "2025-02-04T12:56:56.000Z",13    "connect_account_id": null,14    "destinations": [15      {16        "target": "+27639091249",17        "type": "whatsapp",18        "name": "Sales Point #1",19        "created_at": "2025-02-04T12:56:56.000Z"20      }21    ],22    "currency": "ZAR"23  }24}
```

## Update Virtual Terminal

Update a Virtual Terminal on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

Code of the Virtual Terminal to update

### Body Parameters

Name of the Virtual Terminal

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal/:code"3authorization="Authorization: Bearer SECRET_KEY"4content_type="Content-Type: application/json"5data='{6    "name": "New terminal name"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -X PUT -d "$data"
```

```
1{2  "status": false,3  "message": "\"name\" is required",4  "meta": {5    "nextStep": "Provide all required params "6  },7  "type": "validation_error",8  "code": "missing_params"9}
```

## Deactivate Virtual Terminal

Deactivate a Virtual Terminal on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

Code of the Virtual Terminal to deactivate

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal/:code/deactivate"3authorization="Authorization: Bearer SECRET_KEY"4
5curl "$url" -H "$authorization" -X PUT
```

```
1{2  "status": true,3  "message": "Terminal set to inactive"4}
```

## Assign Destination to Virtual Terminal

Add a destination (WhatsApp number) to a Virtual Terminal on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

Code of the Virtual Terminal

### Body Parameters

An array of objects containing the notification recipients for payments to the Virtual Terminal. Each object includes a `target` parameter for the Whatsapp phone number to send notifications to, and a `name` parameter for a descriptive label.

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal/:code/destination/assign"3authorization="Authorization: Bearer SECRET_KEY"4content_type="Content-Type: application/json"5data='{6    "destinations": [7        {8            "target": "+2341234567890",9            "name": "Another one"10        }11    ]12}'13
14curl "$url" -H "$authorization" -H "$content_type" -X POST -d "$data"
```

```
1{2  "status": true,3  "message": "Destinations assigned successfully",4  "data": [5    {6      "integration": 530700,7      "target": "2341234567890",8      "name": "Another one",9      "type": "whatsapp",10      "id": 27934,11      "createdAt": "2025-02-04T13:26:35.278Z",12      "updatedAt": "2025-02-04T13:26:35.278Z"13    }14  ]15}
```

## Unassign Destination from Virtual Terminal

Unassign a destination (WhatsApp Number) summary of transactions from a Virtual Terminal on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

Code of the Virtual Terminal

### Body Parameters

Array of destination targets to unassign

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal/:code/destination/unassign"3authorization="Authorization: Bearer SECRET_KEY"4content_type="Content-Type: application/json"5data='{6    "targets": ["+2348123456789"]7}'8curl "$url" -H "$authorization" -H "$content_type" -X POST -d "$data"
```

```
1{2  "status": true,3  "message": "Destination deleted successfully"4}
```

## Add Split Code to Virtual Terminal

Add a split code to a Virtual Terminal on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

Code of the Virtual Terminal

### Body Parameters

Split code to be added to the Virtual Terminal

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal/:code/split_code"3authorization="Authorization: Bearer SECRET_KEY"4content_type="Content-Type: application/json"5data='{6    "split_code": "SPL_98WF13Zu8w5"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -X PUT -d "$data"
```

```
1{2  "status": true,3  "message": "Split code assigned",4  "data": {5    "id": 3025782,6    "name": "Dynamic Split at 1729681745076",7    "type": "flat",8    "currency": "ZAR",9    "integration": 530700,10    "domain": "test",11    "split_code": "SPL_HBaFCbbiyI",12    "active": true,13    "bearer_type": "subaccount",14    "bearer_subaccount": 854043,15    "createdAt": "2024-10-23T11:09:05.000Z",16    "updatedAt": "2024-10-23T11:09:05.000Z",17    "is_dynamic": true,18    "subaccounts": [19      {20        "subaccount": {21          "id": 523210,22          "subaccount_code": "ACCT_r56edei4okmllle",23          "business_name": "ABC Ventures",24          "description": "ABC Ventures",25          "primary_contact_name": null,26          "primary_contact_email": null,27          "primary_contact_phone": null,28          "metadata": null,29          "settlement_bank": "African Bank Limited",30          "currency": "ZAR",31          "account_number": "00000000000"32        },33        "share": 160034      },35      {36        "subaccount": {37          "id": 854043,38          "subaccount_code": "ACCT_n8m5vz2itt8y0f1",39          "business_name": "Best Logistics",40          "description": "Best Logistics",41          "primary_contact_name": null,42          "primary_contact_email": null,43          "primary_contact_phone": null,44          "metadata": null,45          "settlement_bank": "Capitec Bank Limited",46          "currency": "ZAR",47          "account_number": "1051366984"48        },49        "share": 9840050      }51    ],52    "total_subaccounts": 253  }54}
```

## Remove Split Code from Virtual Terminal

Remove a split code from a Virtual Terminal on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

Code of the Virtual Terminal

### Body Parameters

Split code to be removed from the Virtual Terminal

```
1#!/bin/sh2url="https://api.paystack.co/virtual_terminal/:code/split_code"3authorization="Authorization: Bearer SECRET_KEY"4content_type="Content-Type: application/json"5data='{6    "split_code": "SPL_98WF13Zu8w5"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -X DELETE -d "$data"
```

```
1{2  "status": false,3  "message": "Payment method does not exist",4  "meta": {5    "nextStep": "Ensure that you're passing the correct reference for the requested resource that exists on this integration"6  },7  "type": "validation_error",8  "code": "not_found"9}
```