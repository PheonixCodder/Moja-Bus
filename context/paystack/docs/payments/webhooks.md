# Webhooks
Webhooks allow you to set up a notification system that can be used to receive updates on certain requests made to the Paystack API.

## Introduction

Generally, when you make a request to an API endpoint, you expect to get a near-immediate response. However, some requests may take a long time to process, which can lead to timeout errors. To prevent a timeout error, a pending response is returned. Since your records need to be updated with the final state of the request, you need to either:

1.  Make a request for an update (popularly known as polling) or,
2.  Listen to events by using a webhook URL.

We recommend that you use webhook to provide value to your customers over using callbacks or polling. With callbacks, we don't have control over what happens on the customer's end. Neither do you. Callbacks can fail if the network connection on a customer's device fails or is weak or if the device goes off after a transaction.

## Polling vs webhooks

[![Image showing a comparison between polling and webhooks](https://paystack.com/docs/static/4e48ac469a56d3f950460a6f7203b0fe/8c557/polling_webhooks.png)](https://paystack.com/docs/static/4e48ac469a56d3f950460a6f7203b0fe/4352a/polling_webhooks.png)

Polling requires making a `GET` request at regular intervals to get the final status of a request. For example, when a customer makes a payment for a transaction, you keep making a request for the transaction status until you get a successful transaction status.

With webhooks, the resource server, Paystack in this case, sends updates to your server when the status of your request changes. The change in status of a request is known as an **event**. You’ll typically listen to these events on a `POST` endpoint called your **webhook URL**.

The table below highlights some differences between polling and webhooks:

|  | Polling | Webhooks |
| --- | --- | --- |
| Mode of update | Manual | Automatic |
| Rate limiting | Yes | No |
| Impacted by scaling | Yes | No |

## Create a webhook URL

A webhook URL is simply a `POST` endpoint that a resource server sends updates to. The URL needs to parse a JSON request and return a `200 OK`:

-   Node
-   PHP

```
12app.post("/my/webhook/url", function(req, res) {3    4    const event = req.body;5    6    res.send(200);7});
```

When your webhook URL receives an event, it needs to parse and acknowledge the event. Acknowledging an event means returning a `200 OK` in the HTTP header. Without a `200 OK` in the response header, events are sent for the next 72 hours:

-   In live mode, webhook events are sent every 3 minutes for the first 4 tries, then retried hourly for the next 72 hours
-   In test mode, webhook events are sent hourly for 10 hours, with a request timeout of 30 seconds.

If you have extra tasks in your webhook function, you should return a 200 OK response immediately. Long-running tasks lead to a request timeout and an automatic error response from your server. Without a `200 OK` response, the retry as described in the proceeding paragraph.

## Verify event origin

Since your webhook URL is publicly available, you need to verify that events originate from Paystack and not a bad actor. There are two ways to ensure events to your webhook URL are from Paystack:

1.  Signature validation
2.  IP whitelisting

### Signature validation

Events sent from Paystack carry the `x-paystack-signature header`. The value of this header is a `HMAC SHA512` signature of the event payload signed using your secret key. Verifying the header signature should be done before processing the event:

```
1const crypto = require('crypto');2const secret = process.env.SECRET_KEY;34app.post("/my/webhook/url", function(req, res) {5    6    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');7    if (hash == req.headers['x-paystack-signature']) {8    9    const event = req.body;10    11    }12    res.send(200);13});
```

### IP whitelisting

With this method, you only allow certain IP addresses to access your webhook URL while blocking out others. Paystack will only send webhooks from the following IP addresses:

1.  **52.31.139.75**
2.  **52.49.173.169**
3.  **52.214.14.220**

You should whitelist these IP addresses and consider requests from other IP addresses a counterfeit.

The IP addresses listed above are applicable to both test and live environments. You can whitelist them in your staging and production environments.

## Go live checklist

Now that you’ve successfully created your webhook URL, here are some ways to ensure you get a delightful experience:

1.  Add the webhook URL on your Paystack [dashboard](https://dashboard.paystack.com/#/settings/developer) or [canvas](https://dashboard.paystack.com/v2/developers)
2.  Ensure your webhook URL is publicly available (localhost URLs can't receive events)
3.  If using `.htaccess` remember to add the trailing `/` to the URL
4.  Test your webhook to ensure you’re getting the JSON body and returning a `200 OK` HTTP response
5.  If your webhook function has long-running tasks, you should first acknowledge receiving the webhook by returning a `200 OK` before proceeding with the long-running tasks
6.  If we don’t get a `200 OK` HTTP response from your webhooks, we flagged it as a failed attempt
7.  In the live mode, failed attempts are retried every 3 minutes for the first 4 tries, then retried hourly for the next 72 hours
8.  In the test mode, failed attempts are retried hourly for the next 10 hours. The timeout for each attempt is 30 seconds.

## Supported events

-   Customer Identification Failed
-   Customer Identification Successful
-   Dispute Created
-   Dispute Reminder
-   Dispute Resolved
-   DVA Assignment Failed
-   DVA Assignment Successful
-   Invoice Created
-   Invoice Failed
-   Invoice Updated
-   Payment Request Pending
-   Payment Request Successful
-   Refund Failed
-   Refund Pending
-   Refund Processed
-   Refund Processing
-   Subscription Created
-   Subscription Disabled
-   Subscription Not Renewing
-   Subscriptions with Expiring Cards
-   Transaction Successful
-   Transfer Successful
-   Transfer Failed
-   Transfer Reversed

```
1{2  "event": "customeridentification.failed",3  "data": {4    "customer_id": 82796315,5    "customer_code": "CUS_XXXXXXXXXXXXXXX",6    "email": "email@email.com",7    "identification": {8      "country": "NG",9      "type": "bank_account",10      "bvn": "123*****456",11      "account_number": "012****345",12      "bank_code": "999991"13    },14    "reason": "Account number or BVN is incorrect"15  }16}
```

## Types of events

Here are the events we currently raise. We would add more to this list as we hook into more actions in the future.

| Event | Description |
| --- | --- |
| `charge.dispute.create` | A dispute was logged against your business |
| `charge.dispute.remind` | A logged dispute hasn't been resolved |
| `charge.dispute.resolve` | A dispute has been resolved |
| `charge.success` | A successful charge was made |
| `customeridentification.failed` | A customer ID validation has failed |
| `customeridentification.success` | A customer ID validation was successful |
| `dedicatedaccount.assign.failed` | This is sent when a DVA couldn't be created and assigned to a customer |
| `dedicatedaccount.assign.success` | This is sent when a DVA has been successfully created and assigned to a customer |
| `invoice.create` | An invoice has been created for a subscription on your account. This usually happens 3 days before the subscription is due or whenever we send the customer their first pending invoice notification |
| `invoice.payment_failed` | A payment for an invoice failed |
| `invoice.update` | An invoice has been updated. This usually means we were able to charge the customer successfully. You should inspect the invoice object returned and take necessary action |
| `paymentrequest.pending` | A payment request has been sent to a customer |
| `paymentrequest.success` | A payment request has been paid for |
| `refund.failed` | Refund can't be processed. Your account will be credited with refund amount |
| `refund.pending` | Refund initiated, waiting for response from the processor. |
| `refund.processed` | Refund has successfully been processed by the processor. |
| `refund.processing` | Refund has been received by the processor. |
| `subscription.create` | A subscription has been created |
| `subscription.disable` | A subscription on your account has been disabled |
| `subscription.expiring_cards` | Contains information on all subscriptions with cards that are expiring that month. Sent at the beginning of the month, to merchants using Subscriptions |
| `subscription.not_renew` | A subscription on your account's status has changed to non-renewing. This means the subscription won't be charged on the next payment date |
| `transfer.failed` | A transfer you attempted has failed |
| `transfer.success` | A successful transfer has been completed |
| `transfer.reversed` | A transfer you attempted has been reversed |