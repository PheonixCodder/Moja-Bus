# Manage Disputes

Automate the process of handling and responding to disputes with our API

When using the Disputes API, you need to:

1.  Retrieve all pending disputes. These are disputes that have been lodged against you but haven't yet been handled.
2.  Retrieve applicable receipts and other documents that you can use to defend against the dispute.
3.  Upload all relevant receipts and documents for the dispute
4.  Resolve the dispute with the applicable resolution

For a list of all the endpoints and parameters, see the [DisputesAPI](https://paystack.com/docs/api/dispute) endpoints.

## Before you begin

Before starting your Disputes API integration, make sure that you:

1.  Understand the disputes process.
2.  Know the scenarios when Paystack automatically handles disputes on your behalf.
3.  Setup a receipts repository on your server. For more information about acceptable receipts, please see [here](https://support.paystack.com/hc/en-us/articles/360012946200-How-to-resolve-chargebacks).
4.  Learn about the type of disputes we have.
5.  Have a copy of your **Secret API Key**, as this will be used for API calls to the endpoints.

## Understanding the disputes process

A dispute occurs when a cardholder contacts their card issuing bank and demands to have their money returned. Disputes are a feature of the card networks intended to protect cardholders from fraudulent activity.

Disputes may arise for a number of reasons including:

1.  Not as described, where the cardholder claims to have never received the goods (debited but no value), or the goods were materially different from their expectations.
2.  Not recognized, where the cardholder has no recollection of what the charge in their bank statement relates to.
3.  Fraud, where the cardholder claims they didn't authorize the purchase (for example their card information was stolen and used fraudulently).
4.  Admin error, such as duplicate billing, incorrect amount billed, or a refund which was promised but never received.

## Scenarios when Paystack auto handles disputes on your behalf

##### Responding to a chargeback

All disputes raised against your integration/business should be handled within 16 hours (please [see this article](https://support.paystack.com/hc/en-us/articles/360014290660-New-Chargeback-Deadlines-for-Nigerian-Businesses) for more information)

In a case where this time elapses, we will automatically accept these on your behalf, and refunds to the affected customers are triggered from your Paystack Balance.

## Setting up a receipts repository on your server

On your app backend, you can have a folder that contains internally generated receipts (preferably in `.pdf` format). It's our recommendation that these receipts can be generated either on receipt of the `charge.success` webhook notification or on verifying the success of the transaction using `GET /transaction/{reference}`.

These receipts should be saved (ideally) with the transaction reference as the name of the file. For example, if you have a transaction with reference `my-demo-transaction-xxx`, then the name of the file for the generated receipt would be `my-demo-transaction-xxx.pdf`. You will understand how this factors in the automated process later on.

## Types of disputes

There are two types of disputes:

1.  Chargebacks
2.  Fraud Claims

Chargebacks usually occur when the customer paid for a product or service and didn't get value for that service but had his bank account debited by you, the merchant, for that service.

Fraud happens when an authorized transaction is made using a customer's payment information by a bad actor. Fraud is a major reason why a customer can raise a dispute at their bank.

## Automating the disputes process

You may decide to create a background task to run this at an interval, or at a certain time every day, or you may just have a button to run this at any time you choose.

### Step 1: Get pending disputes

You can do this by calling our [List DisputesAPI](https://paystack.com/docs/api/dispute#list) endpoint. There are 3 major parameters for this:

| Parameter | Description |
| --- | --- |
| `from` | The datetime from which to start searching for disputes. The recommended format is `yyyy-MM-ddTHH:mm:ss.SSS[Z]` |
| `to` | The datetime to which to end searching for disputes. The recommended format is `yyyy-MM-ddTHH:mm:ss.SSS[Z]` |
| `status` | The status of the dispute. For this process, the status should be `awaiting-merchant-feedback` |

##### Tip

For datetime search, let the start date be at midnight of the date in question (eg. `2020-01-13T00:00:00.000Z`), and let the end date be a second before midnight of the following day (eg `2020-01-13T23:59:59.999Z`).

### Step 2: Upload dispute evidence

Remember when we suggested that you save your receipts with the reference number of the transaction that generated the receipt [over here](https://paystack.com/docs/payments/manage-disputes/#setting-up-a-receipts-repository-on-your-server)? Now we get to put that to use.

Taking each dispute from the array of disputes obtained from the previous step, we will need the dispute `id` and the transaction reference. The dispute id will be used to upload the receipt, while the transaction reference will be used to get the receipt from the repository.

#### Where do I upload this receipt to?

You will need to generate a URL that will be used to upload the receipt. You can do this by calling our [Get Upload URLAPI](https://paystack.com/docs/api/dispute#upload-url) endpoint.

This returns a `signedUrl` where the receipt can be uploaded to and the `filename` that should be used to identify the upload when resolving the dispute.

##### URL Validity

Please note that the `signedUrl` is only valid for 30 minutes.

Once this URL has been obtained, you can then upload the corresponding receipt as evidence that the customer was given value for the charge for which the dispute was raised.

##### Acceptable Format

Acceptable document formats are `.jpg (image/jpg)`, `.jpeg (image/jpeg)` and `.pdf (application/pdf)`.

To upload the receipt, make a `PUT` request with the `signedUrl` as illustrated with the sample code below.

-   Node

```
1var request = require("request");2var fs = require("fs");3
4fs.readFile('./transaction_reference.pdf', function (err, data) {5  var options = {6    method: "PUT",7    url: signedUrl,8    'Content-Type': 'application/pdf',9    body: data10  }11
12  request(options, function (error, response, body) {13    if (error) throw new Error(error);14    console.log(body);15    console.log("Status code: ", response.statusCode);16  });17});
```

If the upload is successful, there will be an **empty string** in the response, so it will be a good idea to see the **status code** returned.

#### What if the dispute is a fraud claim?

You will also be required to provide evidence about the product or service rendered to your customer, as this will be used while investigating the claim. To do this, you will call our [Add EvidenceAPI](https://paystack.com/docs/api/dispute#evidence) endpoint.

### Step 3: Resolve the dispute

This is where you respond to disputes, either accepting or declining the dispute. To accept a dispute, you send a resolution value of `merchant-accepted` while to decline, you send a resolution value of `declined`. If accepting a dispute, you can set the amount (either full or partial) you want to refund the customer with. To reject the dispute, the filename of the upload (done in the previous step) will be required in the request.

You can resolve disputes by calling our [Resolve DisputeAPI](https://paystack.com/docs/api/dispute#resolve) endpoint. Note the following:

1.  The `uploaded_filename` property is the same value we got when creating the upload URL for the transaction receipt.
2.  The `evidence` property is the id obtained when we created an evidence in the previous step. If the dispute isn't a fraud claim, you can leave this as an empty string.
3.  The `amount` should be in the subunit of the [supported currency](https://paystack.com/api#supported-currency).

### Handle webhook

Paystack sends a `charge.dispute.create` event when a dispute is logged on your business. We'll also send a `charge.dispute.remind` event every **4 hours** for chargebacks that aren't resolved. The `charge.dispute.resolve` event is sent once the dispute is resolved. Learn more about [Webhooks](https://paystack.com/docs/payments/webhooks/).

###### On this Page

-   [Before you begin](https://paystack.com/docs/payments/manage-disputes/#before-you-begin)
-   [Understanding the disputes process](https://paystack.com/docs/payments/manage-disputes/#understanding-the-disputes-process)
-   [Scenarios when Paystack auto handles disputes on your behalf](https://paystack.com/docs/payments/manage-disputes/#scenarios-when-paystack-auto-handles-disputes-on-your-behalf)
-   [Setting up a receipts repository on your server](https://paystack.com/docs/payments/manage-disputes/#setting-up-a-receipts-repository-on-your-server)
-   [Types of disputes](https://paystack.com/docs/payments/manage-disputes/#types-of-disputes)
-   [Automating the disputes process](https://paystack.com/docs/payments/manage-disputes/#automating-the-disputes-process)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)