# Invoice Payments

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

You can create an invoice that can be used to accept payment on the Paystack Terminal on order fulfillment

## Introduction

Certain business models allow customers to place an order for goods and services, with an option to make payment on order fulfillment. This is generally known as Pay on Delivery or Collect on Delivery. Merchants receive payment in the future since order fulfillment could range from a few minutes to a few months.

One of the major problems with receiving payments in future is that they usually have to be reconciled manually. Besides the tedious process of manual reconciliation, merchants can't get real-time updates on payments.

With our Payment Request API, you can create an invoice that can be fetched and paid on any of your Paystack Terminals. This allows you to receive payments easily while also automating reconciliation.

The integration flow is a three-step process:

1.  Create a customer, if one doesn't exist already, with the [CustomerAPI](https://paystack.com/docs/api/customer)
2.  Create an invoice with the [Payment RequestAPI](https://paystack.com/docs/api/payment-request)
3.  Listen to events on your webhook URL

## Create a customer

##### Existing Customers

If the customer already exists on your integration, you can fetch their `customer_code` and proceed to the next section

To accept payment on order fulfillment, you'll issue an invoice to a customer. Hence, a customer should exist before creating an invoice.

When creating a customer specifically for the Paystack Terminal, the customer doesn't have to be a person. It can be your:

-   Point of Sale system
-   Vending machine
-   Delivery vehicle

To create a customer, you need to make a `POST` request to the [CustomerAPI](https://paystack.com/docs/api/customer):

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/customer2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "zero@sum.com"5      "first_name": "Zero",6      "last_name": "Sum",7      "phone": "+2348123456789"8    }'9-X POST
```

```
1{2  "status": true,3  "message": "Customer created",4  "data": {5    "transactions": [],6    "subscriptions": [],7    "authorizations": [],8    "email": "zero@sum.com",9    "first_name": "Zero",10    "last_name": "Sum",11    "phone": "+2348123456789",12    "integration": 100032,13    "domain": "test",14    "customer_code": "CUS_xnxdt6s1zg1f4nx",15    "risk_action": "default",16    "id": 1173,17    "identified": false,18    "identifications": null,19    "createdAt": "2021-03-29T20:03:09.584Z",20    "updatedAt": "2021-03-29T20:03:09.584Z"21  }22}
```

When a customer is successfully created, you should save the `customer_code` and `id`, in the response object, in your database. You'll need both parameters when creating an invoice.

## Create an invoice

There are two types of invoices that can be created with the [Payment RequestAPI](https://paystack.com/docs/api/payment-request):

1.  Simple invoice
2.  Professional invoice

The major difference between both invoices is the details they contain. When an invoice is loaded on the Terminal, it displays the details of that invoice to the customer. Your choice is dependent on your business logic and user experience.

### Simple invoice

A simple invoice contains the total amount of a customer's order. This is useful when you want flexibility on the total amount a customer is supposed to pay. For example, you might be running a 2-for-1 campaign where customers get two items for the price of one.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/paymentrequest2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5      "customer": "CUS_gv2e6wdd0os1rd4",6      "amount": 40000,7      "description": "2-for-1 promo"8    }'9-X POST
```

```
1{2  "status": true,3  "message": "Payment request created",4  "data": {5    "id": 8344724,6    "integration": 463433,7    "domain": "test",8    "amount": 40000,9    "currency": "NGN",10    "due_date": null,11    "has_invoice": false,12    "invoice_number": null,13    "description": "2-for-1 promo",14    "line_items": [],15    "tax": [],16    "request_code": "PRQ_xkid8oip8r2gt2y",17    "status": "pending",18    "paid": false,19    "metadata": null,20    "notifications": [],21    "offline_reference": "4634338344724",22    "customer": 60604714,23    "created_at": "2021-11-09T10:47:22.467Z",24    "discount": null,25    "split_code": null26  }27}
```

### Professional invoice

A professional invoice contains a list of goods or services, their quantity, and unit price. This is captured in an array of `line_items`. We calculate the subtotal and total based on the details of the `line_items`.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/paymentrequest2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5      "customer": "CUS_5lgv9bc41uw15pb",6      "description": "Invoice for Damilola",7      "line_items": [8        {"name": "Tripod stand", "amount": "2000000", "quantity": 1},9        {"name": "Lenses", "amount": "300000", "quantity": 1},10        {"name": "White Bulbs", "amount": "50000", "quantity": 5}11      ]12    }'13-X POST
```

```
1{2  "status": true,3  "message": "Payment request created",4  "data": {5    "id": 6304434,6    "integration": 463433,7    "domain": "test",8    "amount": 2550000,9    "currency": "NGN",10    "due_date": "2021-05-18T00:00:00.000Z",11    "has_invoice": true,12    "invoice_number": 4,13    "description": "Invoice for Damilola",14    "line_items": [15      {16        "name": "Tripod stand",17        "amount": "2000000",18        "quantity": 119      },20      {21        "name": "Lenses",22        "amount": "300000",23        "quantity": 124      },25      {26        "name": "White Bulbs",27        "amount": "50000",28        "quantity": 529      }30    ],31    "tax": [],32    "request_code": "PRQ_kwahak3i05nt1ds",33    "status": "pending",34    "paid": false,35    "metadata": null,36    "notifications": [],37    "offline_reference": "4634336304434",38    "customer": 28958104,39    "created_at": "2021-05-17T14:48:53.269Z"40  }41}
```

### Offline reference

When an invoice is successfully created, the JSON response returned contains an `offline_reference` among other parameters. The offline reference is a unique identifier that will be used to complete payment in the future. You should save it in your database and either send it to your customer as:

-   A text message, or
-   A QR code

We also send a copy of the invoice to the customer, if a valid email is used. The email sent to the customer also has the `offline_reference`.

## Accept payment

The Paystack Terminal can be used to accept a payment for an invoice by:

1.  Using the offline reference as an input
2.  Scanning the QR code representing the offline reference

[![Terminal screen containing an input field to fill in the offline reference](https://paystack.com/docs/static/6dae5c9024747166f77b7214e56407d3/5ff7e/find-invoice.png)](https://paystack.com/docs/static/6dae5c9024747166f77b7214e56407d3/5ff7e/find-invoice.png)[![Terminal screen scanning a QR code representing the offline reference](https://paystack.com/docs/static/ca1f1376dcfde6beede79b10e008219e/5ff7e/scan-code.png)](https://paystack.com/docs/static/ca1f1376dcfde6beede79b10e008219e/5ff7e/scan-code.png)

Whichever option you choose, the invoice is displayed on the Terminal for your customers to review and make payments for their items.

## Listen to notifications

##### Receiving notifications

In order to receive notifications, you need to [implement a webhook URL](https://paystack.com/docs/payments/webhooks/) and set the webhook URL on your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)

When payment is made for an invoice, we send an update to your server using webhooks. On your webhook URL, you should listen to these events:

| Event | Description |
| --- | --- |
| `charge.success` | This is sent when the customer successfully makes a payment. It contains the transaction, customer, and card details. |
| `paymentrequest.success` | This is also sent to indicate a successful payment for an invoice. It contains the invoice details. |
| `paymentrequest.pending` | This is sent when the payment request is successfully created. |
| `invoice.payment_failed` |
This is sent when the payment for the invoice failed.

|

-   Transaction Successful
-   Payment Request Successful
-   Payment Request Pending
-   Invoice Failed

```
1{2  "event": "charge.success",3  "data": {4    "id": 1259864309,5    "domain": "live",6    "status": "success",7    "reference": "pos_wtwyrj7n6x",8    "amount": "5000",9    "message": "Payment Made",10    "gateway_response": "Approved or completed successfully",11    "paid_at": "2021-11-04T16:32:33.000Z",12    "created_at": "2021-11-04T16:32:04.000Z",13    "channel": "pos",14    "currency": "NGN",15    "ip_address": "35.178.254.191, 172.70.162.115",16    "metadata": 0,17    "log": null,18    "fees": null,19    "fees_split": null,20    "authorization": {21      "exp_month": null,22      "exp_year": null,23      "account_name": null,24      "receiver_bank_account_number": null,25      "receiver_bank": null26    },27    "customer": {28      "id": 180059003,29      "first_name": null,30      "last_name": null,31      "email": "pos_e3iesb-eh@email.com",32      "customer_code": "CUS_xztjqwng1kzwdbt",33      "phone": null,34      "metadata": null,35      "risk_action": "default",36      "international_format_phone": null37    },38    "plan": {},39    "subaccount": {},40    "split": {},41    "order_id": null,42    "paidAt": "2021-11-04T16:32:33.000Z",43    "requested_amount": "200",44    "pos_transaction_data": null,45    "source": {46      "type": "offline",47      "source": "pos",48      "entry_point": "pos_initialize",49      "identifier": "2232WE17"50    }51  }52}
```

###### On this Page

-   [Introduction](https://paystack.com/docs/terminal/invoice-payments/#introduction)
-   [Create a customer](https://paystack.com/docs/terminal/invoice-payments/#create-a-customer)
-   [Create an invoice](https://paystack.com/docs/terminal/invoice-payments/#create-an-invoice)
-   [Accept payment](https://paystack.com/docs/terminal/invoice-payments/#accept-payment)
-   [Listen to notifications](https://paystack.com/docs/terminal/invoice-payments/#listen-to-notifications)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)