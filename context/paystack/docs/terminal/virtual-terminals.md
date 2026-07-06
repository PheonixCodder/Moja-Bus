# Virtual Terminal

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

Accept in-person payments using your phone and receive payment notifications via Whatsapp

## Introduction

Virtual Terminal transforms a mobile phone into a point-of-sale system, enabling businesses to accept payments without dedicated POS hardware. By connecting a WhatsApp-enabled phone to your Virtual Terminals, you can instantly set up a payment point that supports bank transfers and QR code payments.

Virtual Terminal is ideal for:

-   Small businesses looking to minimize upfront costs
-   Mobile vendors who need flexible payment options
-   Businesses wanting to quickly set up additional payment points
-   Delivery businesses accepting payment on delivery

## Create a virtual terminal

To create a Virtual Terminal, make a `POST` request to the [Virtual TerminalAPI](https://paystack.com/docs/api/virtual-terminal), specifying a name and up to five WhatsApp-enabled phone numbers.

cURLNodePHP

Show Response

```
1curl "https://api.paystack.co/virtual_terminal"2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{5  "name": "Sales Point #1",6  "destinations": [7    {"target": "+2347081234567"}8  ]9}'10-X POST
```

```
1{2  "status": true,3  "message": "Virtual Terminal created",4  "data": {5    "id": 26677,6    "name": "Sales Point #1",7    "integration": 353514,8    "domain": "live",9    "code": "VT_L837PT5K",10    "paymentMethods": [11      {12        "dedicated_nuban_id": 26196910,13        "type": "dedicated_nuban",14        "account_number": "9964842038",15        "account_name": "Paystack Demo/Sales Point #1",16        "bank": "Paystack-Titan"17      }18    ],19    "active": true,20    "metadata": {21      "testing": "metadata"22    },23    "destinations": [24      {25        "target": "2347081234567",26        "type": "whatsapp",27        "name": null28      }29    ],30    "currency": "NGN"31  }32}
```

Once created, the terminal is ready to accept payments through its unique payment page or dedicated payment details (where applicable).

## Accept payments

Once you've created a Virtual Terminal, you can share it with your customers in two ways, depending on your market:

### Use the Paystack-generated poster

Paystack automatically generates a poster for your Virtual Terminal, which you can download and display at your business location. The poster includes a QR code that customers can scan to access the terminal’s payment page.

[![Virtual Terminal poster for a Kenyan business](https://paystack.com/docs/static/311a6d703ab165f1a041e47675cfad46/8c557/vt-poster-ke.png)](https://paystack.com/docs/static/311a6d703ab165f1a041e47675cfad46/f7c2d/vt-poster-ke.png)

Virtual Terminal poster for a Kenyan business

[![Virtual Terminal poster for a South African business](https://paystack.com/docs/static/2c3768291586a49e99ea1b45843a1a0f/8c557/vt-poster-sa.png)](https://paystack.com/docs/static/2c3768291586a49e99ea1b45843a1a0f/f7c2d/vt-poster-sa.png)

Virtual Terminal poster for a South African business

[![Virtual Terminal poster for a Kenyan business](https://paystack.com/docs/static/1186d6895d1eea993037f2f39a468563/8c557/vt-poster-ng.png)](https://paystack.com/docs/static/1186d6895d1eea993037f2f39a468563/f7c2d/vt-poster-ng.png)

Virtual Terminal poster for a Nigerian business

[![Virtual Terminal poster for a South African business](https://paystack.com/docs/static/ca0a1657f534ec268e5cece387e734ab/8c557/vt-poster-civ.png)](https://paystack.com/docs/static/ca0a1657f534ec268e5cece387e734ab/f7c2d/vt-poster-civ.png)

Virtual Terminal poster for an Ivorian business

On the payment page, customers can complete their transaction using the Paystack Checkout, which supports various online payment methods such as cards, bank transfers, and mobile money.

To use the poster for your Virtual Terminal:

1.  **Navigate to the Terminals Tab**: Log in to your [Paystack Dashboard](https://dashboard.paystack.com/#/) and go to the [Terminals](https://dashboard.paystack.com/#/terminals/virtual) tab.
2.  **Select the Virtual Terminal**: Choose the Virtual Terminal for which you want to download a poster.
3.  **Download the Poster**: In the terminal's details, click the "Poster" option. Select the version of the poster you'd like to use and download it.
4.  **Display the Poster**: Place the poster in a visible location where your customers can easily access it.

### Use the dedicated payment details

In supported markets, each Virtual Terminal is assigned unique payment details that allow customers to make direct transfers:

-   Nigeria: A Dedicated Virtual Account
-   Kenya: An M-Pesa Paybill
-   Ghana: A USSD code.

Customers can use these payment details to transfer funds directly to your terminal. These details are included in the API response when the terminal is created and are also displayed on the poster for easy reference.

-   Nigeria
-   Ghana
-   Kenya

```
1{2  "paymentMethods": [3    {4      "dedicated_nuban_id": 26196910,5      "type": "dedicated_nuban",6      "account_number": "9964842038",7      "account_name": "Paystack Demo/Sales Point #1",8      "bank": "Paystack-Titan"9    }10  ]11}
```

## Handle notifications

When a payment is made to your Virtual Terminal, you can receive real-time notifications to stay informed and process transactions efficiently. Paystack provides two notification options:

### Whatsapp notifications

On successful payments, each of registered Whatsapp numbers will receive instant payment notifications for all transactions made to the terminal.

[![Virtual Terminal created notification](https://paystack.com/docs/static/f301a0c91c02ca5d3ae625c0c0a6e883/8c557/vt-created-notification.png)](https://paystack.com/docs/static/f301a0c91c02ca5d3ae625c0c0a6e883/7a18f/vt-created-notification.png)

Virtual Terminal created notification

[![Virtual Terminal transaction notification](https://paystack.com/docs/static/a03395783cc538ff1e10570a445b6b10/8c557/vt-transaction-notification.png)](https://paystack.com/docs/static/a03395783cc538ff1e10570a445b6b10/7a18f/vt-transaction-notification.png)

Virtual Terminal transaction notification

### Webhooks

When payment is made on your Virtual Terminal, you'll receive a `charge.success` event to your server using webhooks. The `metadata` object in the webhook payload will include the code for the Virtual Terminal that was used to make the payment.

-   JSON

```
1{2  "event": "charge.success",3  "data": {4    "id": 4677002219,5    "domain": "test",6    "status": "success",7    "reference": "T173424527684156",8    "amount": 10000,9    "message": null,10    "gateway_response": "Successful",11    "paid_at": "2025-02-11T10:42:20.000Z",12    "created_at": "2025-02-11T10:42:03.000Z",13    "channel": "card",14    "currency": "KES",15    "ip_address": "129.222.206.7",16    "metadata": {17      "virtual_terminal": {18        "code": "VT_68SBY77G"19      },20      "referrer": "https://paystack.shop/pay/vt_68sby77g"21    },22    "fees_breakdown": null,23    "log": null,24    "fees": 290,25    "fees_split": null,26    "authorization": {27      "authorization_code": "AUTH_7k5skwmhxu",28      "bin": "408408",29      "last4": "4081",30      "exp_month": "12",31      "exp_year": "2030",32      "channel": "card",33      "card_type": "visa ",34      "bank": "TEST BANK",35      "country_code": "KE",36      "brand": "visa",37      "reusable": true,38      "signature": "SIG_C9LhIPX2mQ8uckT6In2U",39      "account_name": null,40      "receiver_bank_account_number": null,41      "receiver_bank": null42    },43    "customer": {44      "id": 239551424,45      "first_name": "",46      "last_name": "",47      "email": "h0e5lcb0f0tnqrmixoqa@paystackdemoke-vt.com",48      "customer_code": "CUS_edn4wbf00pcot1p",49      "phone": "",50      "metadata": null,51      "risk_action": "default",52      "international_format_phone": null53    },54    "plan": {},55    "subaccount": {},56    "split": {},57    "order_id": null,58    "paidAt": "2025-02-11T10:42:20.000Z",59    "requested_amount": 10000,60    "pos_transaction_data": null,61    "source": {62      "type": "offline",63      "source": "virtual_terminal",64      "entry_point": "request_inline",65      "identifier": "VT_68SBY77G"66    }67  }68}
```

###### On this Page

-   [Introduction](https://paystack.com/docs/terminal/virtual-terminal/#introduction)
-   [Create a virtual terminal](https://paystack.com/docs/terminal/virtual-terminal/#create-a-virtual-terminal)
-   [Accept payments](https://paystack.com/docs/terminal/virtual-terminal/#accept-payments)
-   [Handle notifications](https://paystack.com/docs/terminal/virtual-terminal/#handle-notifications)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)