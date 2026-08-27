# Dedicated Virtual Accounts

Learn how to create virtual accounts for your customers to pay you with.

##### Feature Availability

This feature is only available to registered businesses in Nigeria and Ghana that have successfully completed [the go-live process](https://support.paystack.com/hc/en-us/articles/360009881220-How-do-I-activate-my-Paystack-Registered-Business-).

## Introduction

Dedicated Virtual Accounts (DVAs) is a feature on the Paystack Dashboard and API that lets you create bank accounts for your customers. These accounts allow your customers to carry out different transactions on your business.

When you create a Dedicated Virtual Account (DVA) for a customer, all bank transfers to that account will automatically be recorded as transactions from that customer.

The creation and assignment of a DVA to a customer involves three steps:

1.  Create a customer
2.  Validate a customer (required for certain business categories)
3.  Create a DVA for the customer

Based on the steps above, there are two possible integration flows:

1.  **Multi-step account assignment**: In this flow, you’ll make a request for each step and handle the response before proceeding to the next step.
2.  **Single-step account assignment**: In this flow, you pass the necessary data to an endpoint that will handle the creation and assignment of a DVA to the customer.

There are asynchronous processes involved in both flows so you need to set up webhooks to get updates on your requests.

## Set up webhooks

For a start, you need to listen to the `charge.success` event. Bank transfers happen from external sources and we only get notified after the transfer is complete. The only way to know when a payment has been done is [through webhooks](https://paystack.com/docs/payments/webhooks/).

The `charge.success` webhook event lets you know when you've received a bank transfer payment. Here's a sample authorization object in the `charge.success` event for a dedicated virtual account payment:

-   JSON

```
1{2  "authorization": {3    "authorization_code": "AUTH_0ozsafcpdf",4    "bin": "413XXX",5    "last4": "X011",6    "exp_month": "01",7    "exp_year": "2020",8    "channel": "dedicated_nuban",9    "card_type": "transfer",10    "bank": "First City Monument Bank",11    "country_code": "NG",12    "brand": "Managed Account",13    "reusable": false,14    "signature": null,15    "sender_bank": "First City Monument Bank",16    "sender_bank_account_number": "XXXXXX0011",17    "sender_country": "NG",18    "sender_name": "RANDALL AKANBI HORTON",19    "narration": "NIP: RHODA CHURCH -1123344343/44343231232",20    "receiver_bank_account_number": "9930000902",21    "receiver_bank": "Test Bank"22  }23}
```

## Multi-step account assignment

This is suited for merchants who want to control each step of the account creation and assignment to a customer. In this flow, you’ll manage the creation of a customer, the validation of the customer, and the creation of a DVA.

### Create a customer

A dedicated virtual account is tied to a customer so you need to create a customer by passing the `email`, `first_name`, `last_name` and `phone` to the [Create customerAPI](https://paystack.com/docs/api/customer#create).

If the customer already exists on your platform, ensure the customer's `first_name`, `last_name` and `phone` are set. This is because we need the customer's details to create a bank account. For customers created without these details, you can update the customer record by passing `first_name`, `last_name` and `phone` when creating the virtual account with [Create Dedicated Virtual AccountAPI](https://paystack.com/docs/api/dedicated-virtual-account#create)

### Validate a customer

##### Process requirement

This is only required for Nigerian businesses.

For compliance reasons, businesses that offer their services under the business categories - **Betting**, **Financial services**, and **General services** can only generate bank account numbers for customers whose personal identity information has been validated. This information is then used in naming the bank account number. Here's how to [validate a customer's identity.](https://paystack.com/docs/identity-verification/validate-customer/)

##### Get Customer's Consent

Generating a dedicated virtual account requires personal customer information, and should only be used with a customer's express consent, not by default.

### Create a dedicated virtual account

To create a dedicated virtual account for a customer, send a `POST` request to our [Create Dedicated Virtual AccountAPI](https://paystack.com/docs/api/dedicated-virtual-account#create).

##### Supported banks

You can get supported banks by calling the [Fetch ProvidersAPI](https://paystack.com/docs/api/dedicated-virtual-account#providers) endpoint.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "customer": "CUS_358xertt55", "preferred_bank": "test-bank"}'5-X POST
```

```
1{2  "status": true,3  "message": "NUBAN successfully created",4  "data": {5    "bank": {6      "name": "Test Bank",7      "id": 24,8      "slug": "test-bank"9    },10    "account_name": "KaroKart Rhoda Church",11    "account_number": "9930000737",12    "assigned": true,13    "currency": "NGN",14    "metadata": null,15    "active": true,16    "id": 253,17    "created_at": "2019-12-12T12:39:04.000Z",18    "updated_at": "2020-01-06T15:51:24.000Z",19    "assignment": {20      "integration": 100043,21      "assignee_id": 7454289,22      "assignee_type": "Customer",23      "expired": false,24      "account_type": "PAY-WITH-TRANSFER-RECURRING",25      "assigned_at": "2020-01-06T15:51:24.764Z"26    },27    "customer": {28      "id": 7454289,29      "first_name": "Rhoda",30      "last_name": "Church",31      "email": "rhodachurch@email.com",32      "customer_code": "CUS_kpb3qj71u1m0rw8",33      "phone": "+2349053267565",34      "risk_action": "default"35    }36  }37}
```

When the customer attempts to make a transfer to the created account number, the account name will follow the format, **Product Name / Customer Name** .

For businesses, that provide virtual accounts as a service, we have a naming feature that lets you personalize the account name based on the company you're providing the service to. You cab send an email to [support@paystack.com](mailto:support@paystack.com) so we can review and extend the feature to your business.

##### Account Limit

By default, you can generate up to **1,000 dedicated bank accounts** for your customers. This limit can be increased upon review of your business and use-case. To increase the limit for your business, send an email to [support@paystack.com](mailto:support@paystack.com)

##### Testing Dedicated Virtual Accounts (Nigeria only)

To create Dedicated Virtual Accounts using your test secret key, use `test-bank` as the `preferred_bank` in the request body parameters.

You can also make a transfer to the test virtual accounts using our [demo bank](https://demobank.paystackintegrations.com/) app.

## Single-step account assignment

In this flow, you pass the customer details to us and we handle the creation and assignment of the DVA to the customer. Your request parameters are dependent on your business category. For compliance reasons, certain businesses are required to validate their customers.

### Required compliance

##### Process requirement

This is only required for Nigerian businesses.

Businesses that offer their services under the business categories - **Betting**, **Financial Services**, and **General services** need to validate the personal identifying information of their customers before a bank account can be generated.

Merchants in this category need to add the customer’s bank details for validation:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account/assign2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5      "email": "janedoe@test.com",6      "first_name": "Jane",7      "middle_name": "Karen",8      "last_name": "Doe",9      "phone": "+2348100000000",10      "preferred_bank": "test-bank",11      "country": "NG",12      "account_number": "0123456789",13      "bvn": "20012345678",14      "bank_code": "007"15}'16-X POST
```

```
1{2  "status": true,3  "message": "Assign dedicated account in progress"4}
```

##### Supported banks

You can get supported banks by calling the [Fetch ProvidersAPI](https://paystack.com/docs/api/dedicated-virtual-account#providers) endpoint.

You'll receive two webhook events due to the customer validation step. If the customer validation step fails, we'll send you the `customeridentification.failed` and `assigndedicatedaccount.failed` events. If all goes well, we'll send you the `customeridentification.success` and the `assigndedicatedaccount.success` events. Check the [handling events](https://paystack.com/docs/payments/dedicated-virtual-accounts/#handling-events) section to learn about the structure of these events.

### Optional compliance

For merchants in this category, you only need to pass the customer data and the preferred bank:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account/assign2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5      "email": "janedoe@test.com",6      "first_name": "Jane",7      "middle_name": "Karen",8      "last_name": "Doe",9      "phone": "+2348100000000",10      "preferred_bank": "test-bank",11      "country": "NG"12}'13-X POST
```

```
1{2  "status": true,3  "message": "Assign dedicated account in progress"4}
```

The `dedicatedaccount.assign.success` event is sent on the successful creation and assignment of the DVA, while the `dedicatedaccount.assign.failed` event is sent when the account couldn't be created. You should check out the [handling events](https://paystack.com/docs/payments/dedicated-virtual-accounts/#handling-events) section to learn about the structure of these events.

## Handling events

We send the following events for different stages of the creation and assignment of a DVA:

| Event | Description |
| --- | --- |
| `customeridentification.success` | This is sent when a customer’s identity has been validated |
| `customeridentification.failed` | This is sent when a customer’s identity couldn't be validated |
| `dedicatedaccount.assign.success` | This is sent when a DVA has been successfully created and assigned to a customer |
| `dedicatedaccount.assign.failed` | This is sent when a DVA couldn't be created and assigned to a customer |

-   Customer Identification Failed
-   Customer Identification Successful
-   DVA Assignment Failed
-   DVA Assignment Successful

```
1{2  "event": "customeridentification.failed",3  "data": {4    "customer_id": 82796315,5    "customer_code": "CUS_XXXXXXXXXXXXXXX",6    "email": "email@email.com",7    "identification": {8      "country": "NG",9      "type": "bank_account",10      "bvn": "123*****456",11      "account_number": "012****345",12      "bank_code": "999991"13    },14    "reason": "Account number or BVN is incorrect"15  }16}
```

## Get a customer's dedicated virtual account

If you want to retrieve a customer's dedicated virtual account, call the [Fetch CustomerAPI](https://paystack.com/docs/api/customer#fetch) endpoint. You can retrieve the dedicated virtual account from the `dedicated_account` object in the response:

-   JSON

```
1{2  "status": true,3  "message": "Customer retrieved",4  "data": {5    "transactions": [],6    "subscriptions": [],7    "authorizations": [],8    "first_name": "Rhoda",9    "last_name": "Church",10    "email": "rhodachurch@email.com",11    "phone": "08154211006",12    "domain": "live",13    "customer_code": "CUS_dy1r7ts03zstbq5",14    "dedicated_account": {15      "bank": {16        "name": "Test Bank",17        "id": 24,18        "slug": "test-bank"19      },20      "id": 173,21      "account_name": "KAROKART/RHODA CHURCH",22      "account_number": "9930020212",23      "created_at": "2019-12-09T13:31:38.000Z",24      "updated_at": "2019-12-09T16:04:25.000Z",25      "currency": "NGN",26      "active": true,27      "assigned": true,28      "assignment": {29        "assignee_id": 1530104,30        "assignee_type": "Integration",31        "account_type": "PAY-WITH-TRANSFER-RECURRING",32        "integration": 10004333      }34    }35  }36}
```

## Requery a customer's dedicated virtual account

When a customer makes a transfer to a dedicated virtual account, a transaction is automatically created for the customer, and a webhook is sent to your server to notify you of the transaction. This typically happens within a few minutes.

In some cases, the notification could take longer to come in. When this happens, the customer might reach out to you that their account/wallet hasn't been credited, or they would try to refresh their balance in your app.

In this scenario, you can use the [Requery Dedicated Virtual AccountAPI](https://paystack.com/docs/api/dedicated-virtual-account#requery) endpoint to check the virtual account for new transactions that haven't been processed yet. Calling this endpoint will trigger a background requery process, and if any pending transactions are found, the transaction will be created, and the webhook notification will be sent to your server.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account/requery?account_number={accountNumber}&provider_slug={provider_slug}&date={yyyy-mm-dd}2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-X GET
```

```
1{2  "status": true,3  "message": "We are checking the status of your transfer. We will send you a notification once it is confirmed"4}
```

##### Rate Limit

You're only allowed to requery a dedicated virtual account once every ten minutes. If you try to requery a dedicated virtual account more than once in a 10 minute window, the request won't be processed.

## Split payment on dedicated virtual account

Split payment for dedicated virtual allows you to automatically split funds received into a dedicated virtual account between your main settlement bank account and one or more bank account(s).

##### Prerequisite

You need a basic knowledge of [Split Payments](https://paystack.com/docs/payments/split-payments/) or [Multi-split Payments](https://paystack.com/docs/payments/multi-split-payments/) before proceeding with this section.

There are two ways to add split payment on dedicated virtual account:

1.  [Add a subaccount when creating a dedicated virtual account](https://paystack.com/docs/payments/dedicated-virtual-accounts/#add-a-subaccount-when-creating-a-dedicated-virtual-account)
2.  [Add a subaccount to an existing dedicated virtual account](https://paystack.com/docs/payments/dedicated-virtual-accounts/#add-a-subaccount-to-an-existing-dedicated-virtual-account)

For multi-split payment on dedicated virtual account:

1.  [Add a split code when creating a dedicated virtual account](https://paystack.com/docs/payments/dedicated-virtual-accounts/#add-a-split-code-when-creating-a-dedicated-virtual-account)
2.  [Add a split code to an existing dedicated virtual account](https://paystack.com/docs/payments/dedicated-virtual-accounts/#add-a-split-code-to-an-existing-dedicated-virtual-account)

### Add a subaccount when creating a dedicated virtual account

You can add a subaccount code to the payload when you create a dedicated virtual account for the customer

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "customer": 481193, 5      "preferred_bank":"test-bank", 6      "subaccount": "SUB_ACCOUNTCODE" 7    }'8-X POST
```

```
1{2  "status": true,3  "message": "Assigned Managed Account Successfully Created",4  "data": {5    "bank": {6      "name": "Test Bank",7      "id": 24,8      "slug": "test-bank"9    },10    "account_name": "KAROKART/YINKA ADE",11    "account_number": "6731105168",12    "assigned": true,13    "currency": "NGN",14    "metadata": null,15    "active": true,16    "id": 97,17    "created_at": "2019-11-13T13:52:39.000Z",18    "updated_at": "2020-03-17T07:52:23.000Z",19    "assignment": {20      "integration": 100043,21      "assignee_id": 17328,22      "assignee_type": "Customer",23      "expired": false,24      "account_type": "PAY-WITH-TRANSFER-RECURRING",25      "assigned_at": "2020-03-17T07:52:23.023Z",26      "expired_at": null27    },28    "split_config": {29      "subaccount": "ACC_qwerty"30    },31    "customer": {32      "id": 17328,33      "first_name": "YINKA",34      "last_name": "ADE",35      "email": "yinka@testemail.com",36      "customer_code": "CUS_xxxxxxxx",37      "phone": null,38      "metadata": null,39      "risk_action": "default"40    }41  }42}
```

### Add a subaccount to an existing dedicated virtual account

When updating an already existing dedicated virtual account, you can pass a subaccount code as one of the parameters.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account/split2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "account_number": "0033322211", "subaccount": "SUB_ACCOUNTCODE" }'5-X POST
```

```
1{2  "status": true,3  "message": "Subaccount assigned",4  "data": {5    "id": 22495,6    "account_name": "KAROKART/YINKA ADE",7    "account_number": "0033322211",8    "assigned": 1,9    "currency": "NGN",10    "metadata": null,11    "active": 1,12    "last_assignment_id": 525,13    "createdAt": "2020-03-20T11:03:43.000Z",14    "updatedAt": "2020-03-20T11:03:43.000Z",15    "assignment_id": 525,16    "split_config": {17      "subaccount": "ACCT_4r33icuptxl40vv"18    }19  }20}
```

##### Updating existing subaccount on a dedicated virtual account

You can also use this endpoint to edit an existing subaccount on any dedicated virtual account. If a dedicated virtual account has a subaccount, using this endpoint updates the subaccount to the new subaccount.

### Add a split code when creating a dedicated virtual account

You can add a split code to the payload when you create a dedicated virtual account for the customer

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "customer": 481193, 5      "preferred_bank":"test-bank", 6      "split_code": "SPL_e7jnRLtzla" 7    }'8-X POST
```

```
1{2  "status": true,3  "message": "Assigned Managed Account Successfully Created",4  "data": {5    "bank": {6      "name": "Test Bank",7      "id": 24,8      "slug": "test-bank"9    },10    "account_name": "KAROKART/YINKA ADE",11    "account_number": "6731105168",12    "assigned": true,13    "currency": "NGN",14    "metadata": null,15    "active": true,16    "id": 97,17    "created_at": "2019-11-13T13:52:39.000Z",18    "updated_at": "2020-03-17T07:52:23.000Z",19    "assignment": {20      "integration": 100043,21      "assignee_id": 17328,22      "assignee_type": "Customer",23      "expired": false,24      "account_type": "PAY-WITH-TRANSFER-RECURRING",25      "assigned_at": "2020-03-17T07:52:23.023Z",26      "expired_at": null27    },28    "split_config": {29      "split_code": "SPL_e7jnRLtzla"30    },31    "customer": {32      "id": 17328,33      "first_name": "YINKA",34      "last_name": "ADE",35      "email": "yinka@testemail.com",36      "customer_code": "CUS_xxxxxxxx",37      "phone": null,38      "metadata": null,39      "risk_action": "default"40    }41  }42}
```

### Add a split code to an existing dedicated virtual account

When updating an already existing dedicated virtual account, you can pass a split code as one of the parameters.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account/split2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "account_number": "0033322211", "split_code": "SPL_e7jnRLtzla" }'5-X POST
```

```
1{2  "status": true,3  "message": "Subaccount assigned",4  "data": {5    "id": 22495,6    "account_name": "KAROKART/YINKA ADE",7    "account_number": "0033322211",8    "assigned": 1,9    "currency": "NGN",10    "metadata": null,11    "active": 1,12    "last_assignment_id": 525,13    "createdAt": "2020-03-20T11:03:43.000Z",14    "updatedAt": "2020-03-20T11:03:43.000Z",15    "assignment_id": 525,16    "split_config": {17      "split_code": "SPL_e7jnRLtzla"18    }19  }20}
```

##### Updating existing split code on a dedicated virtual account

You can also use this endpoint to edit an existing split code on any dedicated virtual account. If a dedicated virtual account has a split code, using this endpoint updates the split code to the new split code.

### Remove split

This allows you to remove a subaccount code assigned to any dedicated virtual account, so that subsequent transactions received are fully settled into the main settlement account

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/dedicated_account/split2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "account_number": "0033322211" }'5-X DELETE
```

```
1{2  "status": "success",3  "message": "Subaccount unassigned",4  "data": {5    "id": 22173,6    "split_config": null,7    "account_name": "KAROKART/YINKA ADE",8    "account_number": "0033322211",9    "currency": "NGN",10    "assigned": true,11    "active": true,12    "createdAt": "2020-03-11T15:14:00.707Z",13    "updatedAt": "2020-03-11T15:14:00.707Z"14  }15}
```

## Inbound transfer approval

##### Feature Availability

Only Paystack-Titan Virtual Accounts support this feature.

Inbound transfer approval allows businesses to accept or reject individual transactions to **Paystack-Titan Virtual Accounts**. This feature works for Dedicated Virtual Accounts and Pay with Transfer. It enables businesses to control the virtual account transactions they wish to receive, thereby reducing the overheads associated with managing unwanted transactions and processing refunds.

To enable this feature, go to the Settings page, and look for Virtual accounts in the [Preferences tab](https://dashboard.paystack.com/#/settings/preferences) on your dashboard. Select the `Inbound Transfer Approval` option and provide a webhook url that will process the webhook events.

[![Image of transfer approval from the dashboard](https://paystack.com/docs/static/3a9ffe4e914d266b2b661a5b0637ffd6/8c557/virtual_accounts_approval.png)](https://paystack.com/docs/static/3a9ffe4e914d266b2b661a5b0637ffd6/1134b/virtual_accounts_approval.png)

Paystack will send a webhook event with details of the payer account and the receiver account when a customer attempts a transfer to an account. You can use these details to make your decision.

```json
1{2  "payer_account_number": "44940573849",3  "payer_account_name": "CIOKARAINE LAMAR",4  "payer_bank_code": "00711",5  "payer_bank_name": "Guaranty Trust Bank",6  "receiver_account_number": "00000000001",7  "receiver_account_name": "AUBREY GRAHAM",8  "recipient_account_type": "bank_transfer OR dedicated_nuban",9  "session_id": "10000000000000000000000000000",10  "sent_at": "2024-07-31T11:28:06.872Z",11  "provider": "titan-paystack",12  "amount": 10000,13  "narration": "Transfer from CIOKARAINE LAMAR"14}
```

##### Response times

Please avoid long-running tasks. We require a response within 5 seconds otherwise Paystack will automatically accept the inbound transfer. Also ensure you’re returning HTTP 200 OK status codes for both Accept & Reject responses.

Your server should respond in less than 5 seconds with a JSON response containing the `decision`, either `REJECT` or `ACCEPT`. You can include a `reason` parameter, that explains the decision. This will appear on your dashboard.

```json
1{2  "decision": "REJECT || ACCEPT",3  "reason": "Optional explanation here"4}
```

In cases where we're unable to reach your approval endpoint, we’ll automatically accept the transfer, and complete the transaction. We don't retry the webhook event.

###### On this Page

-   [Introduction](https://paystack.com/docs/payments/dedicated-virtual-accounts/#introduction)
-   [Set up webhooks](https://paystack.com/docs/payments/dedicated-virtual-accounts/#set-up-webhooks)
-   [Multi-step account assignment](https://paystack.com/docs/payments/dedicated-virtual-accounts/#multi-step-account-assignment)
-   [Single-step account assignment](https://paystack.com/docs/payments/dedicated-virtual-accounts/#single-step-account-assignment)
-   [Handling events](https://paystack.com/docs/payments/dedicated-virtual-accounts/#handling-events)
-   [Get a customer's dedicated virtual account](https://paystack.com/docs/payments/dedicated-virtual-accounts/#get-a-customers-dedicated-virtual-account)
-   [Requery a customer's dedicated virtual account](https://paystack.com/docs/payments/dedicated-virtual-accounts/#requery-a-customers-dedicated-virtual-account)
-   [Split payment on dedicated virtual account](https://paystack.com/docs/payments/dedicated-virtual-accounts/#split-payment-on-dedicated-virtual-account)
-   [Inbound transfer approval](https://paystack.com/docs/payments/dedicated-virtual-accounts/#inbound-transfer-approval)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)