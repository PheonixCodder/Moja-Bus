## Quick start

[#### Accept Payments

Collect payments from cards, bank and mobile money accounts](https://paystack.com/docs/payments/)[#### Send Money

Make instant transfers to bank accounts and mobile money numbers](https://paystack.com/docs/transfers/)[#### Identify your Customers

Verify phone numbers, bank accounts or card details](https://paystack.com/docs/identity-verification/)[#### Other ways to use Paystack

Explore libraries and tools for accepting payments without the API](https://paystack.com/docs/developer-tools/)

## Accept a payment

Here’s how to use the Paystack API to accept a payment

#### Before you begin

Authenticate all Paystack API calls using your secret keys

-   Next

post

api.paystack.co/transaction/initialize

cURL

```
1curl https://api.paystack.co/transaction/initialize 2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-X POST5
```

## Make a transfer

Here’s how quickly you can send money on Paystack

#### Before you begin

Authenticate all Paystack API calls using your secret keys

Next

post

api.paystack.co/transferrecipient

cURL

```
1curl https://api.paystack.co/transferrecipient 2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-X POST5
```

## Explore demos

We’ve put together simple projects to demonstrate how to use the Paystack API for various financial services. [Explore all demos](https://github.com/PaystackOSS/) or start with the most popular ones below:

##### Gift Store

[PaystackOSS/sample-gift-store](https://github.com/PaystackOSS/sample-gift-store)

APIS USED

* * *

-   [Accept Payments](https://paystack.com/docs/payments/accept-payments/)
-   [Verify Payments](https://paystack.com/docs/payments/verify-payments/)

Vue

##### Movie Ticket

[PaystackOSS/sample-movie-ticket](https://github.com/PaystackOSS/sample-movie-ticket)

APIS USED

* * *

-   [Accept Payments](https://paystack.com/docs/payments/accept-payments/)
-   [Verify Payments](https://paystack.com/docs/payments/verify-payments/)

Android

##### Invoice Payments

[PaystackOSS/sample-logistics](https://github.com/PaystackOSS/sample-logistics)

APIS USED

* * *

-   [Create Customer](https://paystack.com/docs/payments/accept-payments/)
-   [Payment Request](https://paystack.com/docs/payments/verify-payments/)

Vue

##### Push Payment Requests

[PaystackOSS/sample-restaurant](https://github.com/PaystackOSS/sample-restaurant)

APIS USED

* * *

-   [Payment Request](https://paystack.com/docs/payments/accept-payments/)
-   [Terminal Event](https://paystack.com/docs/payments/verify-payments/)

React

Navigated to Paystack Documentation