# Recurring Charges

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

Once a customer has made the first successful payment with their card or direct debit account, you can store the customer's authorization and use it for subsequent transactions. **This currently works for cards in all our markets, and direct debit for businesses in Nigeria.**

## Charge the first transaction

##### Note

This step isn't needed for [Direct Debit](https://paystack.com/docs/payments/direct-debit/) charges. Instead, you'll initiate an authorization request via the [Initialize AuthorizationAPI](https://paystack.com/docs/api/customer#initialize-authorization) endpoint. You'll save the authorization returned via webhooks, once the customer approves it.

You can initialize this first charge from web or your mobile app. Check out the different integration methods for [web and mobile](https://paystack.com/docs/developer-tools/).

### Why do I need to charge the user to add their cards?

1.  Local regulations require that users authenticate the card through `2FA` in an initial transaction before we can charge the card subsequently.
2.  It allows us to ensure that the card is valid and can be charged for subsequent transactions.

##### Minimum charge amount

The minimum amount recommended for the first charge is **NGN 50.00**, **GHS 0.10**, **ZAR 1.00**, **KES 3.00**, or **USD 2.00**. Lower amounts aren't guaranteed to work on all card brands or banks.

It's standard practice to credit the user back with value (in your app) worth the tokenization amount, or simply refund the money back.

## Get the card authorization

If the first transaction is successful, you can listen to events on [your webhook endpoint](https://paystack.com/docs/payments/webhooks/). Alternatively, you can use the [Verify TransactionAPI](https://paystack.com/docs/api/transaction#verify) endpoint to confirm the status of the transaction. In either case, the response looks like the sample below:

-   JSON

```
1{2  "data": {3    "authorization": {4      "authorization_code": "AUTH_8dfhjjdt",5      "card_type": "visa",6      "last4": "1381",7      "exp_month": "08",8      "exp_year": "2018",9      "bin": "412345",10      "bank": "TEST BANK",11      "channel": "card",12      "signature": "SIG_idyuhgd87dUYSHO92D",13      "reusable": true,14      "country_code": "NG",15      "account_name": "BoJack Horseman"16    }17  }18}
```

You'll notice that the `data` object in the response contains an `authorization` object within it, which contains the details of the payment instrument (card in this case) that the user paid with.

| Property | Description |
| --- | --- |
| `authorization_code` | This is the code that's used to charge the card subsequently |
| `card_type` | This tells you the card brand - Visa, Mastercard, etc |
| `last4` | The last 4 digits of the card. This is one of the details you can use to help the user identify the card |
| `exp_month` | The expiry month of the card in digits. Eg. "01" means January |
| `exp_year` | The expiry year of the card |
| `bin` | The first 6 digits of the card. This and the last 4 digits constitute the **masked pan** |
| `bank` | The customer's bank, the bank that issued the card |
| `channel` | What payment channel this is. In this case, it's a card payment |
| `signature` | A unique identifier for the card being used. While new authorization codes are created each time a card is used, the card's signature will remain the same. |
| `reusable` | A boolean flag that tells you if an authorization can be used for a recurring charge. You should only attempt to use the `authorization_code` if this flag returns as `true`. |
| `country_code` | A two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)) representing the country of the bank where the card was issued |

## Store the authorization

Next, you need to store the `authorization` and the `email` used for the transaction. These details can be used to charge the card subsequently. Every payment instrument that's used on your site/app has a unique `signature` . The `signature` can be used to ensure that you don't save an authorization multiple times.

##### Note

It's important to store the entire `authorization` object in order not to lose any context regarding the card.

It's also important to store the email used to create an authorization because only the email used to create an authorization can be used to charge it. If you rely on the user's email stored on your system and the user changes it, the authorization can no longer be charged.

When you have the whole authorization object saved, you can display customer payment details at the point of payment to charge recurrently. For example, when the user wants to pay again, you can display the card for the user as **Access Bank Visa card ending with 1234**.

## Charge the authorization

When the user selects the card or direct debit account for a new transaction or when you want to charge them subsequently, you send the `authorization_code`, user's `email` and the `amount` you want to charge to the [charge authorizationAPI](https://paystack.com/docs/api/transaction#charge-authorization).

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transaction/charge_authorization2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "authorization_code" : "AUTH_pmx3mgawyd", 5      email: "mail@mail.com", 6      amount: "300000" 7    }'8-X POST
```

```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "amount": 35247,6    "currency": "NGN",7    "transaction_date": "2024-08-22T10:53:49.000Z",8    "status": "success",9    "reference": "0m7frfnr47ezyxl",10    "domain": "test",11    "metadata": "",12    "gateway_response": "Approved",13    "message": null,14    "channel": "card",15    "ip_address": null,16    "log": null,17    "fees": 10247,18    "authorization": {19      "authorization_code": "AUTH_pmx3mgawyd",20      "bin": "408408",21      "last4": "4081",22      "exp_month": "12",23      "exp_year": "2030",24      "channel": "card",25      "card_type": "visa ",26      "bank": "TEST BANK",27      "country_code": "NG",28      "brand": "visa",29      "reusable": true,30      "signature": "SIG_yEXu7dLBeqG0kU7g95Ke",31      "account_name": null32    },33    "customer": {34      "id": 181873746,35      "first_name": null,36      "last_name": null,37      "email": "demo@test.com",38      "customer_code": "CUS_1rkzaqsv4rrhqo6",39      "phone": null,40      "metadata": {41        "custom_fields": [42          {43            "display_name": "Customer email",44            "variable_name": "customer_email",45            "value": "new@email.com"46          }47        ]48      },49      "risk_action": "default",50      "international_format_phone": null51    },52    "plan": null,53    "id": 409949025154  }55}
```

##### Charging at intervals

If your app needs to charge the authorizations at certain intervals, it means your server needs to have a cron job that runs at particular intervals and picks all the authorizations that needs to be charged.

## Two factor authentication

##### Feature Availability

By default, this feature is available to betting merchants with a Nigerian integration and specific to cards issued by Guaranty Trust Bank (GTB), Access Bank, United Bank for Africa (UBA), Zenith Bank & First Bank of Nigeria. If you have a Nigerian integration and would like to get this feature, send an email to **support@paystack.com**

Two Factor Authentication (2FA) is an extra security step taken to confirm that you aren’t processing the request of a malicious actor. The user making the request is generally asked to provide some form of information that's unique to them.

To ensure a user’s card isn’t being used by a malicious actor, we challenge the user by asking the user to authorize the transaction. Authorization can be done by using a hardware token, OTP, PIN + OTP, or 3DS.

The request to charge the card remains the same. However, the response is different for cards that will be challenged:

-   JSON

```
1{2  "status": true,3  "message": "Please, redirect your customer to the authorization url provided",4  "data": {5    "authorization_url": "https://checkout.paystack.com/resume/0744ub5o065nwyz",6    "reference": "jvx2o36ghlvrgtt",7    "access_code": "0744ub5o065nwyz",8    "paused": true9  }10}
```

When a card is challenged, the response will contain two distinct parameters among others:

| Parameter | Type | Description |
| --- | --- | --- |
| paused | boolean | Returns true when a card is being challenged |
| `authorization_url` | string | A checkout URL for authorization of the transaction |

You should check the value of the `data.paused` parameter to confirm if a card is being challenged. If it’s being challenged, you should redirect the user to the `data.authorization_url` to complete the authorization.

[![Image of the checkout page for user authorization](https://paystack.com/docs/static/eed204e2b886573a978ea0ba240452e8/8c557/two_fa.png)](https://paystack.com/docs/static/eed204e2b886573a978ea0ba240452e8/87cc4/two_fa.png)

On completion of the authorization, we proceed to charge the user's card. You should save the `data.reference` value to verify the status of the transaction either via [webhooks](https://paystack.com/docs/payments/webhooks/) or the [verify transactionAPI](https://paystack.com/docs/api/transaction#verify).

### Handling redirect

When the user completes the authorization process, we typically redirect the user back to the callback URL you’ve set on your Paystack [dashboard](https://dashboard.paystack.co/#/settings/developer) or [canvas](https://dashboard.paystack.com/v2/developers). If you want us to redirect to a different URL, you can add the URL to the `callback_url` parameter of your request:

-   JSON

```
1{2  "authorization_code": "AUTH_ibegucp8kk",3  "email": "dami@2fa.com",4  "amount": 3000,5  "callback_url": "https://yourcallbackurl.com"6}
```

The user might also cancel the authorization process. You can add a URL that the user should be redirected to when they cancel in the `metadata` object:

-   JSON

```
1{2  "authorization_code": "AUTH_ibegucp8kk",3  "email": "dami@2fa.com",4  "amount": 3000,5  "metadata": {6    "cancel_action": "https://yourcancelurl.com"7  }8}
```

###### On this Page

-   [Charge the first transaction](https://paystack.com/docs/payments/recurring-charges/#charge-the-first-transaction)
-   [Get the card authorization](https://paystack.com/docs/payments/recurring-charges/#get-the-card-authorization)
-   [Store the authorization](https://paystack.com/docs/payments/recurring-charges/#store-the-authorization)
-   [Charge the authorization](https://paystack.com/docs/payments/recurring-charges/#charge-the-authorization)
-   [Two factor authentication](https://paystack.com/docs/payments/recurring-charges/#two-factor-authentication)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)