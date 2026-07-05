# Single Transfers

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

Send money to your customers by using the Transfer API

You can transfer money in four easy steps:

1.  [Create a transfer recipient](https://paystack.com/docs/transfers/single-transfers/#create-a-transfer-recipient)
2.  [Generate a transfer reference](https://paystack.com/docs/transfers/single-transfers/#generate-a-transfer-reference)
3.  [Initiate a transfer](https://paystack.com/docs/transfers/single-transfers/#initiate-a-transfer)
4.  [Listen for transfer status](https://paystack.com/docs/transfers/single-transfers/#listen-for-transfer-status)

##### Before you begin!

To send money on Paystack, you need API keys to authenticate your transfers. You can find your keys on the Paystack Dashboard under [Settings → API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developer).

## Create a transfer recipient

A transfer recipient is a beneficiary on your integration that you can send money to. Before sending money to your customer, you need to collect their details first, then use their details to [create a transfer recipient](https://paystack.com/docs/transfers/creating-transfer-recipients/). We support different recipients in different countries:

| Type | Description | Currency |
| --- | --- | --- |
| `ghipss` | This means Ghana Interbank Payment and Settlement Systems. It represents bank account in Ghana. | **GHS** |
| `mobile_money` | Mobile Money or MoMo is an account tied to a mobile number. | **GHS/KES** |
| `kepss` | This is the Kenya Electronic Payment and Settlement System. It represents bank accounts in Kenya. | **KES** |
| `nuban` | This means the Nigerian Uniform Bank Account Number. It represents bank accounts in Nigeria. | **NGN** |
| `basa` | This means the Banking Association South Africa. It represents bank accounts in South Africa. | **ZAR** |
| `authorization` | This is a unique code that represents a customer’s card. We return an authorization code after a user makes a payment with their card. | **All** |

The `recipient_code` from the data object is the unique identifier for a user and would be used to make transfers to that customer This code should be saved with the customer's records in your database.

## Generate a transfer reference

A transfer reference is a unique identifier that lets you track, manage and reconcile each transfer request made on your integration. Transfer references allow you to prevent double crediting as you can retry a non-conclusive transfer rather than initiate a new request.

In order to take advantage of a transfer reference, you need to generate and provide it for every request. We recommend [generating a v4 UUID](https://www.uuidgenerator.net/version4) reference of no more than **50 characters**. However, here are the constraints to take note of regardless of the logic you decide to implement:

1.  The reference can only contain lowercase letters (`a-z`), digits (`0-9`) and these symbols: underscore (`_`) and dash (`_`)
2.  The minimum length should be **16 characters**
3.  The maximum length should be **50 characters**
4.  You can prepend or append special identifiers to the reference to further reduce the chances of collision

-   JSON

```
1{2  "source": "balance",3  "reason": "Bonus for the week",4  "amount": 100000,5  "recipient": "RCP_gd9vgag7n5lr5ix",6  "reference": "acv_9ee55786-2323-4760-98e2-6380c9cb3f68"7}
```

## Initiate a transfer

To send money to a customer, you make a `POST` request to the [Initate TransferAPI](https://paystack.com/docs/api/transfer#initiate), passing the `reference` and `recipient_code` previously created.

##### Disabling OTP

When building a fully automated system, you might need to disable OTP for transfers. You can disable OTP from the [Preferences tab](https://dashboard.paystack.com/#/settings/preferences) on the Paystack Dashboard. You should uncheck the **Confirm transfers before sending** checkbox as shown in the image below.

[![Image of the disabled OTP state of transfers](https://paystack.com/docs/static/fc8433d173880ec22798a363ba565ab8/8c557/disabled_otp.png)](https://paystack.com/docs/static/fc8433d173880ec22798a363ba565ab8/098c1/disabled_otp.png)

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/transfer2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5  "source": "balance",6  "amount": 100000,7  "reference": "acv_9ee55786-2323-4760-98e2-6380c9cb3f68",8  "recipient": "RCP_gd9vgag7n5lr5ix",9  "reason": "Bonus for the week"10}'11-X POST12
```

```
1{2  "status": true,3  "message": "Transfer has been queued",4  "data": {5    "transfersessionid": [],6    "transfertrials": [],7    "domain": "test",8    "amount": 100000,9    "currency": "NGN",10    "reference": "acv_9ee55786-2323-4760-98e2-6380c9cb3f68",11    "source": "balance",12    "source_details": null,13    "reason": "Bonus for the week",14    "status": "success",15    "failures": null,16    "transfer_code": "TRF_v5tip3zx8nna9o78",17    "titan_code": null,18    "transferred_at": null,19    "id": 860703114,20    "integration": 463433,21    "request": 1068439313,22    "recipient": 56824902,23    "createdAt": "2025-08-04T10:32:40.000Z",24    "updatedAt": "2025-08-04T10:32:40.000Z"25  }26}
```

When you send this request, if there are no errors, the response comes back with a pending status, while the transfer is being processed.

##### Retrying a transfer

If there is an error with the transfer request, **you should retry the transaction with the same `reference` to avoid double crediting**. If a new `reference` is used, the transfer would be treated as a new request.

Test transfers always return success, because there is no processing involved. The live transfers processing usually take between a few seconds and a few minutes. When it's done processing, a notification is sent to your webhook URL.

## Verify a transfer

When a transfer is initiated, it could take a few seconds or minutes to be processed. This is why we recommend relying on webhooks for verification as opposed to polling.

### Verify via webhooks

##### Receiving Notifications

In order to receive notifications, you need to [implement a webhook URL](https://paystack.com/docs/payments/webhooks/) and set the webhook URL on your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer).

Once a transfer is processed, we send the final status of the transfer as a `POST` request to your webhook URL.

| Event | Description |
| --- | --- |
| `transfer.success` | This is sent when the transfer is successful |
| `transfer.failed` | This is sent when the transfer fails |
| `transfer.reversed` | This is sent when we refund a previously debited amount for a transfer that couldn’t be completed |

-   Transfer Successful
-   Transfer Failed
-   Transfer Reversed

```
1{2  "event": "transfer.success",3  "data": {4    "amount": 100000,5    "createdAt": "2025-08-04T10:32:40.000Z",6    "currency": "NGN",7    "domain": "test",8    "failures": null,9    "id": 860703114,10    "integration": {11      "id": 463433,12      "is_live": true,13      "business_name": "Paystack Demo",14      "logo_path": "https://public-files-paystack-prod.s3.eu-west-1.amazonaws.com/integration-logos/hpyxo8n1c7du6gxup7h6.png"15    },16    "reason": "Bonus for the week",17    "reference": "acv_9ee55786-2323-4760-98e2-6380c9cb3f68",18    "source": "balance",19    "source_details": null,20    "status": "success",21    "titan_code": null,22    "transfer_code": "TRF_v5tip3zx8nna9o78",23    "transferred_at": null,24    "updatedAt": "2025-08-04T10:32:40.000Z",25    "recipient": {26      "active": true,27      "createdAt": "2023-07-11T15:42:27.000Z",28      "currency": "NGN",29      "description": "",30      "domain": "test",31      "email": null,32      "id": 56824902,33      "integration": 463433,34      "metadata": null,35      "name": "Jekanmo Padie",36      "recipient_code": "RCP_gd9vgag7n5lr5ix",37      "type": "nuban",38      "updatedAt": "2023-07-11T15:42:27.000Z",39      "is_deleted": false,40      "details": {41        "authorization_code": null,42        "account_number": "9876543210",43        "account_name": null,44        "bank_code": "044",45        "bank_name": "Access Bank"46      }47    },48    "session": {49      "provider": null,50      "id": null51    },52    "fee_charged": 0,53    "gateway_response": null54  }55}
```

### Verify via polling

If you prefer to use an endpoint to verify the status of the transfer, you can call the [Verify TransferAPI](https://paystack.com/docs/api/transfer#verify) endpoint with the transfer reference you used for the request:

cURLNodePHP

Show Response

```
1#!/bin/sh2url="https://api.paystack.co/transfer/verify/{reference}"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Transfer retrieved",4  "data": {5    "amount": 100000,6    "createdAt": "2025-08-04T09:59:19.000Z",7    "currency": "NGN",8    "domain": "test",9    "failures": null,10    "id": 860670817,11    "integration": 463433,12    "reason": "Bonus for the week",13    "reference": "acv_9ee55786-2323-4760-98e2-6380c9cb3f67",14    "source": "balance",15    "source_details": null,16    "status": "success",17    "titan_code": null,18    "transfer_code": "TRF_8opchtrhtjlfz90n",19    "request": 1068403325,20    "transferred_at": null,21    "updatedAt": "2025-08-04T09:59:19.000Z",22    "recipient": {23      "active": true,24      "createdAt": "2023-07-11T15:42:27.000Z",25      "currency": "NGN",26      "description": "",27      "domain": "test",28      "email": null,29      "id": 56824902,30      "integration": 463433,31      "metadata": null,32      "name": "Jekanmo Padie",33      "recipient_code": "RCP_gd9vgag7n5lr5ix",34      "type": "nuban",35      "updatedAt": "2023-07-11T15:42:27.000Z",36      "is_deleted": false,37      "isDeleted": false,38      "details": {39        "authorization_code": null,40        "account_number": "9876543210",41        "account_name": null,42        "bank_code": "044",43        "bank_name": "Access Bank"44      }45    },46    "session": {47      "provider": null,48      "id": null49    },50    "fee_charged": 1000,51    "fees_breakdown": null,52    "gateway_response": null53  }54}
```

##### Verification status

The HTTP status code you get from the API response indicates the status of the API call and not the status of the transfer. The status of the transfer is in the `data` object of the response, i.e `data.status`. The status of a transfer should only be updated with the `data.status` value when you get a **200 status code**. Check out the [how transfers work page](https://paystack.com/docs/transfers/how-transfers-work/) to learn more about handling transfer statuses.

###### On this Page

-   [Create a transfer recipient](https://paystack.com/docs/transfers/single-transfers/#create-a-transfer-recipient)
-   [Generate a transfer reference](https://paystack.com/docs/transfers/single-transfers/#generate-a-transfer-reference)
-   [Initiate a transfer](https://paystack.com/docs/transfers/single-transfers/#initiate-a-transfer)
-   [Verify a transfer](https://paystack.com/docs/transfers/single-transfers/#verify-a-transfer)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)