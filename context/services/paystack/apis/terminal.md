# Terminal
The Terminal API allows you to build delightful in-person payment experiences.

## Send Event

Send an event from your app to the Paystack Terminal

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

The ID of the Terminal the event should be sent to.

### Body Parameters

The type of event to push. We currently support `invoice` and `transaction`

The action the Terminal needs to perform. For the `invoice` type, the action can either be `process` or `view`. For the `transaction` type, the action can either be `process` or `print`.

The paramters needed to perform the specified action. For the `invoice` type, you need to pass the invoice id and offline reference: `{id: invoice_id, reference: offline_reference}`. For the `transaction` type, you can pass the transaction id: `{id: transaction_id}`

```
1#!/bin/sh2url="https://api.paystack.co/terminal/{terminal_id}/event"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "type": "invoice",7  "action": "process",8  "data": { 9    "id": 7895939, 10    "reference": 463433789593911  }12}'13
14curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Event sent to Terminal",4  "data": {5    "id": "616d721e8c5cd40a0cdd54a6"6  }7}
```

## Fetch Event Status

Check the status of an event sent to the Terminal

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The ID of the Terminal the event was sent to.

The ID of the event that was sent to the Terminal

```
1#!/bin/sh2url="https://api.paystack.co/terminal/{terminal_id}/event/{event_id}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Message Status Retrieved",4  "data": {5    "delivered": true6  }7}
```

## Fetch Terminal Status

Check the availiability of a Terminal before sending an event to it

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The ID of the Terminal you want to check

```
1#!/bin/sh2url="https://api.paystack.co/terminal/{terminal_id}/presence"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Terminal status retrieved",4  "data": {5    "online": true,6    "available": false7  }8}
```

## List Terminals

List the Terminals available on your integration

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

A cursor that indicates your place in the list. It can be used to fetch the next page of the list

A cursor that indicates your place in the list. It should be used to fetch the previous page of the list after an intial next request

```
1#!/bin/sh2url="https://api.paystack.co/terminal"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Terminals retrieved successfully",4  "data": [5    {6      "id": 30,7      "serial_number": "033301504100A563877",8      "device_make": null,9      "terminal_id": "2872S934",10      "integration": 463433,11      "domain": "live",12      "name": "Damilola's Terminal",13      "address": null,14      "status": "active"15    }16  ],17  "meta": {18    "next": null,19    "previous": null,20    "perPage": 121  }22}
```

## Fetch Terminal

Get the details of a Terminal

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The ID of the Terminal the event was sent to.

```
1#!/bin/sh2url="https://api.paystack.co/terminal/{terminal_id}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Terminal retrieved successfully",4  "data": {5    "id": 30,6    "serial_number": "033301504100A563877",7    "device_make": null,8    "terminal_id": "2872S934",9    "integration": 463433,10    "domain": "live",11    "name": "Damilola's Terminal",12    "address": null,13    "status": "active"14  }15}
```

## Update Terminal

Update the details of a Terminal

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Path Parameters

The ID of the Terminal you want to update

### Body Parameters

The address of the Terminal

```
1#!/bin/sh2url="https://api.paystack.co/terminal/{terminal_id}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "address": "Somewhere on earth"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Terminal Details updated"4}
```

## Commission Terminal

Activate your debug device by linking it to your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

```
1#!/bin/sh2url="https://api.paystack.co/terminal/commission_device"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "serial_number": "1111150412230003899"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": false,3  "message": "Device has been commissioned already"4}
```

## Decommission Terminal

Unlink your debug device from your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

```
1#!/bin/sh2url="https://api.paystack.co/terminal/decommission_device"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ 6  "serial_number": "1111150412230003899"7}'8
9curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "Device decommissioned successfully"4}
```