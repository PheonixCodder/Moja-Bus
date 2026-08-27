# Integration
The Integration API allows you manage some settings on your integration.

## Fetch Timeout

Fetch the payment session timeout on your integration

### Headers

Set value to `Bearer SECRET_KEY`

```
1#!/bin/sh2url="https://api.paystack.co/integration/payment_session_timeout"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Payment session timeout retrieved",4  "data": {5    "payment_session_timeout": 306  }7}
```

## Update Timeout

Update the payment session timeout on your integration

### Headers

Set value to `Bearer SECRET_KEY`

Set value to `application/json`

### Body Parameters

Time before stopping session **(in seconds)**. Set to 0 to cancel session timeouts

```
1#!/bin/sh2url="https://api.paystack.co/integration/payment_session_timeout"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{ "timeout": 30 }'6
7curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X PUT
```

```
1{2  "status": true,3  "message": "Payment session timeout updated",4  "data": {5    "payment_session_timeout": 306  }7}
```