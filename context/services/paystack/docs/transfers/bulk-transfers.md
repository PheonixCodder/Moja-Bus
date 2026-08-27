# Bulk Transfers

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

Send money to multiple recipients at once with Paystack bulk transfer API

Some business models require sending money to multiple customers at the same time. For example, a payroll management system requires sending salaries to all employees at a certain time of the month. Large disbursements such as this require careful orchestration to ensure that all customers get paid and your system doesn’t get overwhelmed.

The [Bulk TransferAPI](https://paystack.com/docs/api/transfer#bulk) endpoint handles large disbursement orchestration, helping businesses focus on delivering value to their customers.

##### Before you begin!

To send money on Paystack, you need API keys to authenticate your transfers. You can find your keys on the Paystack Dashboard under [Settings → API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developer).

## Creating recipients

A transfer recipient is a beneficiary on your integration that you can send money to. Before sending money to your customers, you need to collect their details first, then use their details to [create a transfer recipient](https://paystack.com/docs/transfers/creating-transfer-recipients/). We support different recipients in different countries:

| Type | Description | Currency |
| --- | --- | --- |
| `ghipss` | This means Ghana Interbank Payment and Settlement Systems. It represents bank account in Ghana. | **GHS** |
| `mobile_money` | Mobile Money or MoMo is an account tied to a mobile number. | **GHS/KES** |
| `kepss` | This is the Kenya Electronic Payment and Settlement System. It represents bank accounts in Kenya. | **KES** |
| `nuban` | This means the Nigerian Uniform Bank Account Number. It represents bank accounts in Nigeria. | **NGN** |
| `basa` | This means the Banking Association South Africa. It represents bank accounts in South Africa. | **ZAR** |
| `authorization` | This is a unique code that represents a customer’s card. We return an authorization code after a user makes a payment with their card. | **All** |

Once created, save the `recipient_code` to your DB and make it available for the transfer initiation. This is a one time process in the transfer lifecycle. Since you’d be sending money to multiple recipients at interval, you’d only be fetching the recipients from your DB for each transfer request.

## Managing batches

Before creating the transfer request, you need to break the requests into batches. A batch is a subset of your requests that makes it easier to manage and track your transfers. In code, a batch is an array of transfer objects:

-   JSON

```
1{2  "transfers": [3    {4      "amount": 20000,5      "reference": "acv_2627bbfe-1a2a-4a1a-8d0e-9d2ee6c31496",6      "reason": "Bonus for the week",7      "recipient": "RCP_gd9vgag7n5lr5ix"8    },9    {10      "amount": 35000,11      "reference": "acv_1bd0c1f8-78c2-463b-8bd4-ed9eeb36be50",12      "reason": "Bonus for the week",13      "recipient": "RCP_zpk2tgagu6lgb4g"14    },15    {16      "amount": 15000,17      "reference": "acv_11bebfc3-18b3-40aa-a4df-c55068c93457",18      "reason": "Bonus for the week",19      "recipient": "RCP_dfznnod8rwxlwgn"20    }21  ]22}
```

##### Generate transfer reference

You should always generate a unique transfer reference for each transfer object. The transfer reference will help you keep track and manage each transfer. You can check out the [generating a transfer reference](https://paystack.com/docs/transfers/single-transfers/#generate-a-transfer-reference) section to learn more.

Each object in the `transfers` array is the same parameters for a single request. A batch shouldn't contain more than **100 items** and each batch should be sent every **5 seconds**:

| Parameter | Config |
| --- | --- |
| Batch size | <= 100 |
| Duration | Every 5 seconds |

Merchants who have set up transfer approval via **URL** should ensure they can approve all transfers in each batch within a few seconds (ideally, microseconds), else they risk the possibility of ending up with transfers with `blocked` status. So while planning the batch size, you should factor in the time it takes to verify the authenticity of each transfer.

The duration is to avoid getting rate limited. Sending multiple requests at short intervals would lead to a `429` (Too many requests) error.

With your batch properly planned and implemented, you can now initiate the bulk transfer.

## Initiate bulk transfer

##### Disable OTP

If you’ve enabled OTP for transfer approval, you need to disable it to use this endpoint.

In addition to the array of `transfers` in your batch, you need to add the `currency` and `source` to make a request to the [Bulk TransferAPI](https://paystack.com/docs/api/transfer#bulk) endpoint:

cURLNodePHP

Show Response

```
1#!/bin/sh2url="https://api.paystack.co/transfer/bulk"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4content_type="Content-Type: application/json"5data='{6  "currency": "NGN",7  "source": "balance",8  "transfers": [9    {10      "amount": 20000,11      "reference": "acv_2627bbfe-1a2a-4a1a-8d0e-9d2ee6c31496",12      "reason": "Bonus for the week",13      "recipient": "RCP_gd9vgag7n5lr5ix"14    },15    {16      "amount": 35000,17      "reference": "acv_1bd0c1f8-78c2-463b-8bd4-ed9eeb36be50",18      "reason": "Bonus for the week",19      "recipient": "RCP_zpk2tgagu6lgb4g"20    },21    {22      "amount": 15000,23      "reference": "acv_11bebfc3-18b3-40aa-a4df-c55068c93457",24      "reason": "Bonus for the week",25      "recipient": "RCP_dfznnod8rwxlwgn"26    }27  ]28}'29
30curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

```
1{2  "status": true,3  "message": "3 transfers queued.",4  "data": [5    {6      "reference": "acv_2627bbfe-1a2a-4a1a-8d0e-9d2ee6c31496",7      "recipient": "RCP_gd9vgag7n5lr5ix",8      "amount": 20000,9      "transfer_code": "TRF_o0mv5dc2lv4t2wdb",10      "currency": "NGN",11      "status": "success"12    },13    {14      "reference": "acv_1bd0c1f8-78c2-463b-8bd4-ed9eeb36be50",15      "recipient": "RCP_zpk2tgagu6lgb4g",16      "amount": 35000,17      "transfer_code": "TRF_tlvxomz43gjso2py",18      "currency": "NGN",19      "status": "success"20    },21    {22      "reference": "acv_11bebfc3-18b3-40aa-a4df-c55068c93457",23      "recipient": "RCP_dfznnod8rwxlwgn",24      "amount": 15000,25      "transfer_code": "TRF_yt2y2gcd3dmli8av",26      "currency": "NGN",27      "status": "success"28    }29  ]30}
```

Unlike single transfers, the `data` parameter in the response object returns an array of objects. Each object represent a transfer in your batch. It’s important to note that the transfer status works like the single transfer. You can take a look at the transfer lifecycle if you need a refresher on how a transfer status is updated.

Test transfers always return `success`, because there is no processing involved. Live transfers are queued while they're being processed so you need to set up a webhook URL to receive the updates on your request.

##### Heads up!

While you might have sent your transfers in batches, notifications are sent for each transfer in a batch. So if you have 100 transfers in a batch, you’ll receive 100 events (one per transfer) for that batch.

## Verify a transfer

The update on a transfer isn’t always instant because of the queuing and processing time, so you need to set up a webhook URL where we’ll `POST` updates to when processing is completed.

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

-   [Creating recipients](https://paystack.com/docs/transfers/bulk-transfers/#creating-recipients)
-   [Managing batches](https://paystack.com/docs/transfers/bulk-transfers/#managing-batches)
-   [Initiate bulk transfer](https://paystack.com/docs/transfers/bulk-transfers/#initiate-bulk-transfer)
-   [Verify a transfer](https://paystack.com/docs/transfers/bulk-transfers/#verify-a-transfer)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)