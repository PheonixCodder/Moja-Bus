# Subscriptions

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

The Subscriptions API lets developers embed recurring billing functionality in their applications, without having to manage the billing cycle themselves. Merchants can easily create plans and charge customers automatically, on a recurring basis. We support Card and Direct Debit (Nigeria) only.

Here is how to set up a subscription:

1.  [Create a plan](https://paystack.com/docs/payments/subscriptions/#create-a-plan)
2.  [Create a subscription](https://paystack.com/docs/payments/subscriptions/#create-a-subscription)
3.  [Listen for subscription events](https://paystack.com/docs/payments/subscriptions/#listen-for-subscription-events)

## Create a plan

Plans are the foundational building block for subscriptions. A plan represents what you're selling, how much you're selling it for, and how often you're charging for it.

You can create a plan via the [Paystack Dashboard](https://dashboard.paystack.com/#/plans), or by calling the [create planAPI](https://paystack.com/docs/api/plan#create) endpoint, passing:

| Param | Type | Description |
| --- | --- | --- |
| `name` | string | The name of the plan |
| `interval` | string | The interval at which to charge subscriptions on this plan. Available options are `hourly`, `daily`, `weekly`, `monthly`, `quarterly`, `biannually` (every 6 months) and `annually` |
| `amount` | integer | The amount to charge |

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/plan2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "name": "Monthly Retainer", 5      "interval": "monthly", 6      "amount": 5000007    }'8-X POST
```

```
1{2  "status": true,3  "message": "Plan created",4  "data": {5    "name": "Monthly Retainer",6    "interval": "monthly",7    "amount": 500000,8    "integration": 428626,9    "domain": "test",10    "currency": "NGN",11    "plan_code": "PLN_u4cqud8vabi89hx",12    "invoice_limit": 0,13    "send_invoices": true,14    "send_sms": true,15    "hosted_page": false,16    "migrate": false,17    "id": 49122,18    "createdAt": "2020-05-22T12:36:12.333Z",19    "updatedAt": "2020-05-22T12:36:12.333Z"20  }21}
```

##### Monthly Subscription Billing

Billing for subscriptions with a monthly interval depends on the day of the month the subscription was created. If the subscription was created on or before the 28th of the month, it gets billed on the same day, every month, for the duration of the plan. Subscriptions created on or between the 29th - 31st, will get billed on the 28th of every subsequent month, for the duration of the plan

You can also pass `invoice_limit`, which lets you set how many times a customer can be charged on this plan. So if you set `invoice_limit: 5` on a monthly plan, then the customer will be charged every month, for 5 months. If you don't pass `invoice_limit`, we'll continue to charge the customer until the plan is cancelled.

## Create a subscription

Now that we have a plan, we can move on to the next step: subscribing a customer to that plan. There are a couple of ways we can go about creating a new subscription.

1.  Adding Plan code to a transaction
2.  Using the [create subscriptionAPI](https://paystack.com/docs/api/subscription#create) endpoint

### Adding plan code to a transaction

You can create a subscription for a customer using the [initialize transactionAPI](https://paystack.com/docs/api/transaction#initialize) endpoint, by adding the `plan_code` of a plan you've created to the body of your request. This will override the transaction amount passed, and charge the customer the amount of the plan instead.

Once the customer pays, they'll automatically be subscribed to the plan, and will be billed according to the interval (and invoice limit) set on the plan.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transaction/initialize2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "500000", 6      "plan": "PLN_xxxxxxxxxx" 7    }'8-X POST
```

```
1{2  "status": true,3  "message": "Authorization URL created",4  "data": {5    "authorization_url": "https://checkout.paystack.com/nkdks46nymizns7",6    "access_code": "nkdks46nymizns7",7    "reference": "nms6uvr1pl"8  }9}
```

### Using the create subscription endpoint

You can also create a subscription by calling the [create subscriptionAPI](https://paystack.com/docs/api/subscription#create) endpoint, passing a `customer` and `plan`. The customer must have already done a transaction on your Paystack integration. This is because the Subscriptions API uses card and direct debit authorizations to charge customers, so there needs to be an existing authorization to charge.

##### Note

If a customer has multiple authorizations, you can select which one to use for the subscription, by passing the `authorization_code` as `authorization` when creating the subscription. Otherwise, Paystack picks the most recent `authorization` to charge.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/subscription2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "customer": "CUS_xxxxxxxxxx", "plan": "PLN_xxxxxxxxxx" }'5-X POST
```

```
1{2  "status": true,3  "message": "Subscription successfully created",4  "data": {5    "customer": 24259516,6    "plan": 49122,7    "integration": 428626,8    "domain": "test",9    "start": 1590152172,10    "status": "active",11    "quantity": 1,12    "amount": 500000,13    "authorization": {14      "authorization_code": "AUTH_pmx3mgawyd",15      "bin": "408408",16      "last4": "4081",17      "exp_month": "12",18      "exp_year": "2020",19      "channel": "card",20      "card_type": "visa DEBIT",21      "bank": "Test Bank",22      "country_code": "NG",23      "brand": "visa",24      "reusable": true,25      "signature": "SIG_2Gvc6pNuzJmj4TCchXfp",26      "account_name": null27    },28    "invoice_limit": 0,29    "subscription_code": "SUB_i6wmhzi0lu95oz7",30    "email_token": "n27dvho4kjsf1sq",31    "id": 161872,32    "createdAt": "2020-05-22T12:56:12.514Z",33    "updatedAt": "2020-05-22T12:56:12.514Z",34    "cron_expression": "0 0 22 * *",35    "next_payment_date": "2020-06-22T00:00:00.000Z"36  }37}
```

You can also pass a `start_date` parameter, which lets you set the date for the first debit. This makes this method useful for situations where you'd like to give a customer a free period before you start charging them, or when you want to switch a customer to a different plan.

##### Subscriptions aren't retried

If a subscription charge fails, we don't retry it. Subscriptions are ideal for situations where value is delivered after payment. For example Payment for internet service or a streaming service.

## Listen for subscription events

Creating a subscription will result in Paystack sending the following events:

1.  A `subscription.create` event is sent to indicate that a subscription was created for the customer who was charged.
2.  If you created the subscription by adding a plan code to a transaction, a `charge.success` event is also sent to indicate that the transaction was successful.

The following steps will happen for each subsequent billing cycle:

1.  An `invoice.create` event will be sent to indicate a charge attempt will be made on the subscription. This will be sent 3 days before the next payment date.
2.  On the next payment date, a `charge.success` event will be sent, if the charge attempt was successful. If not, an `invoice.payment_failed` event will be sent instead.
3.  An `invoice.update` event will be sent after the charge attempt. This will contain the final status of the invoice for this subscription payment, as well as information on the charge if it was successful

Cancelling a subscription will also trigger events:

1.  A `subscription.not_renew` event will be sent to indicate that the subscription won't renew on the next payment date.
2.  On the next payment date, a `subscription.disable` event will be sent to indicate that the subscription has been cancelled.

On completion of all billing cycles for a subscription, a final `subscription.disable` event will be sent, with `status` set to `complete`.

-   Invoice Created
-   Invoice Failed
-   Invoice Updated
-   Subscription Created
-   Subscription Disabled
-   Subscription Not Renewing
-   Transaction Successful

```
1{2  "event": "invoice.create",3  "data": {4    "domain": "test",5    "invoice_code": "INV_thy2vkmirn2urwv",6    "amount": 50000,7    "period_start": "2018-12-20T15:00:00.000Z",8    "period_end": "2018-12-19T23:59:59.000Z",9    "status": "success",10    "paid": true,11    "paid_at": "2018-12-20T15:00:06.000Z",12    "description": null,13    "authorization": {14      "authorization_code": "AUTH_9246d0h9kl",15      "bin": "408408",16      "last4": "4081",17      "exp_month": "12",18      "exp_year": "2020",19      "channel": "card",20      "card_type": "visa DEBIT",21      "bank": "Test Bank",22      "country_code": "NG",23      "brand": "visa",24      "reusable": true,25      "signature": "SIG_iCw3p0rsG7LUiQwlsR3t",26      "account_name": "BoJack Horseman"27    },28    "subscription": {29      "status": "active",30      "subscription_code": "SUB_fq7dbe8tju0i1v8",31      "email_token": "3a1h7bcu8zxhm8k",32      "amount": 50000,33      "cron_expression": "0 * * * *",34      "next_payment_date": "2018-12-20T00:00:00.000Z",35      "open_invoice": null36    },37    "customer": {38      "id": 46,39      "first_name": "Asample",40      "last_name": "Personpaying",41      "email": "asam@ple.com",42      "customer_code": "CUS_00w4ath3e2ukno4",43      "phone": "",44      "metadata": null,45      "risk_action": "default"46    },47    "transaction": {48      "reference": "9cfbae6e-bbf3-5b41-8aef-d72c1a17650g",49      "status": "success",50      "amount": 50000,51      "currency": "NGN"52    },53    "created_at": "2018-12-20T15:00:02.000Z"54  }55}
```

## Managing subscriptions

So you've set up your plans, and you've started subscribing customers to them. In this section, we'll talk about how to manage those subscriptions, to make sure you don't miss payments, and your customers don't lose service.

#### Understanding subscription statuses

Subscription statuses are key to managing your subscriptions. Each status contains information about a subscription, that lets you know if you need to take action or not, to keep that customer. There are currently 5 possible statuses a subscription can have.

| Status | Description |
| --- | --- |
| `active` | The subscription is currently active, and will be charged on the next payment date. |
| `non-renewing` | The subscription is currently active, but we won't be charging it on the next payment date. This occurs when a subscription is about to be complete, or has been cancelled (but we haven't reached the next payment date yet). |
| `attention` | The subscription is still active, but there was an issue while trying to charge the customer's card. The issue can be an expired card, insufficient funds, etc. We'll attempt charging the card again on the next payment date. |
| `completed` | The subscription is complete, and will no longer be charged. |
| `cancelled` | The subscription has been cancelled, and we'll no longer attempt to charge the card on the subscription. |

### Handling subscription payment issues

As mentioned in the previous section, if a subscription's status is `attention`, then it means that there was a problem with trying to charge the customer's card, and we were unable to successfully debit them.

To fix the issue, you can take a look at the `most_recent_invoice` object returned in the body of the [fetch subscriptionAPI](https://paystack.com/docs/api/subscription#fetch) response. This object contains information about the most recent attempt to charge the card on the subscription. If the subscription's status is `attention`, then the `most_recent_invoice` object will have a status field set to `failed`, and a description field, with more information about what went wrong when attempting to charge the card.

```json
1{  2
3  "data": {  4
5    "most_recent_invoice": {6      "subscription": 326005,7      "integration": 530700,8      "domain": "test",9      "invoice_code": "INV_fjtns483x9c2fyw",10      "customer": 92740135,11      "transaction": 1430031421,12      "amount": 50000,13      "period_start": "2021-11-10T13:00:00.000Z",14      "period_end": "2021-11-10T13:59:59.000Z",15      "status": "attention",16      "paid": 1,17      "retries": 1,18      "authorization": 242063633,19      "paid_at": "2021-11-10T13:00:09.000Z",20      "next_notification": "2021-11-07T13:59:59.000Z",21      "notification_flag": null,22      "description": "Insufficient Funds",23      "id": 3953926,24      "created_at": "2021-11-10T13:00:05.000Z",25      "updated_at": "2021-11-10T13:00:10.000Z"26      }27
28  }  29}
```

At the beginning of each month, we'll also send a `subscription.expiring_cards` webhook, which contains information about all subscriptions with cards that expire that month. You can use this to proactively reach out to your customers, and have them update the card on their subscription.

```json
1{2  "event":"subscription.expiring_cards",3  "data":[4    {5      "expiry_date":"12/2021",6      "description":"visa ending with 4081",7      "brand":"visa",8      "subscription":{9        "id":94729,10        "subscription_code":"SUB_lejj927x2kxciw1",11        "amount":44000,12        "next_payment_date":"2021-11-11T00:00:01.000Z",13        "plan":{14          "interval":"monthly",15          "id":22637,16          "name":"Premium Service (Monthly)",17          "plan_code":"PLN_pfmwz75o021slex"18        }19      },20      "customer":{21        "id":7808239,22        "first_name":"Bojack",23        "last_name":"Horseman",24        "email":"bojackhoresman@gmail.com",25        "customer_code":"CUS_8v6g420rc16spqw"26      }27    }28  ]29}
```

### Updating subscriptions

To make changes to a subscription, you’ll use the [Update PlanAPI](https://paystack.com/docs/api/plan/#update) endpoint. You should consider whether you want to change existing subscriptions or keep them as they are. For example, if you’re updating the price, or the charge intervals. You’ll use the `update_existing_subscriptions` parameter to control this:

-   When set to `true` : All subscriptions will be updated, and the changes will apply on the next billing cycle.
-   When set to `false`: Current subscriptions will stay the same, and only new ones will follow the updates.

If you omit this parameter, the updates will automatically apply to all subscriptions.

### Updating the card on a subscription

When a customer's subscription has a card or bank with a payment issue, you can generate a link to a hosted subscription management page, where they can update their authorization. On the page, your customer will have the option to either add a new card, a direct debit account, or cancel their subscription. If they choose to add a new card, Paystack will charge the card a small amount to tokenize it. Don't worry, the charge is immediately refunded.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/subscription/:code/manage/link2-H "Authorization: Bearer YOUR_SECRET_KEY"3-X GET
```

```
1{2  "status": true,3  "message": "Link generated",4  "data": {5    "link": "https://paystack.com/manage/subscriptions/qlgwhpyq1ts9nsw?subscription_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWJzY3JpcHRpb25fY29kZSI6IlNVQl9xbGd3aHB5cTB0czluc3ciLCJpbnRlZ3JhdGlvbiI6MzUzNTE0LCJkb21haW4iOiJ0ZXN0IiwiZW1haWxfdG9rZW4iOiJzNXIwZjA0ODdwcnNtZWsiLCJpYXQiOjE2MzUyNTkxMzEsIm5iZiI6MTYzNTI1OTEzcjeR82XhwIjoxNjM1MzQ1NTMxfQ.FK1glvwMjHu9J8P-4n2oXPN_u_fIpQZ-F_s5x_4WLag"6  }7}
```

If you already have a page where your subscribers can manage their subscriptions, you can choose to have a button or link on that page that will generate the link and redirect the customer to the subscription management page.

Alternatively, you can trigger an email from Paystack to the customer, with the link included.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/subscription/:code/manage/email2-H "Authorization: Bearer YOUR_SECRET_KEY"3-X POST
```

```
1{2  "status": true,3  "message": "Email successfully sent"4}
```

###### On this Page

-   [Create a plan](https://paystack.com/docs/payments/subscriptions/#create-a-plan)
-   [Create a subscription](https://paystack.com/docs/payments/subscriptions/#create-a-subscription)
-   [Listen for subscription events](https://paystack.com/docs/payments/subscriptions/#listen-for-subscription-events)
-   [Managing subscriptions](https://paystack.com/docs/payments/subscriptions/#managing-subscriptions)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)