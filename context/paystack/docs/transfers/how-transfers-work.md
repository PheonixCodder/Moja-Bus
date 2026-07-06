# How Transfers Work

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

A transfer goes through a sequence of processes from initiation to completion.

[![Image of a transfer lifecycle](https://paystack.com/docs/static/6c075bd33be95f9aed6a6e1891adf3f7/8c557/transfer-lifecycle-1.png)](https://paystack.com/docs/static/6c075bd33be95f9aed6a6e1891adf3f7/6871f/transfer-lifecycle-1.png)

When a transfer request is initiated, it goes through a sequence of processes:

1.  Request validation
2.  Transfer creation
3.  Approval checks
4.  Queue transfer
5.  Await processor

Each process determines the status of a transfer at a particular time. When a transfer has been created, its status can be gotten from the `data.status` parameter. The meaning of each status is described in the table below:

| Status | Meaning | Conclusive? |
| --- | --- | --- |
| `pending` | Transfer is being processed. | No |
| `success` | Transfer has been successfully processed. A successfully processed transfer doesn’t equate to instant credit to the customer. | Yes |
| `reversed` | Transfer couldn’t be processed. Typically, this means the customer’s bank is unable to receive money at that moment. The transfer amount is returned. Merchant can retry the transfer later. | Yes |
| `failed` | Transfer couldn't be processed. This typically happens when the processor is down. You can retry again. | Yes |
| `otp` | The transfer requires an addition approval step before processing can continue. OTP is sent to email and/or phone number. | No |
| `abandoned` | This happens when OTP isn't provided within 30 mins. Transfer won’t be processed afterwards. | Yes |
| `blocked` | This happens when the merchant’s server fails to perform either an approval or rejection on the transfer request. | Yes |
| `rejected` | This happens when the merchant’s server declines a transfer request. | Yes |
| `received` | A transfer has this status when it requires approval from the merchants server and the approval request has been sent. | No |

A conclusive status is one in which no further action can be performed on. When a transfer has a conclusive status, it means we're done processing such a request.

##### Avoiding double credit

Before retrying a transfer, ensure you’ve gotten a conclusive status. If you’ve not gotten a conclusive status for a particular transfer and need to retry, you should use the same transfer reference.

## Request validation

At this point, we run a series of checks on your integration to ensure you are able to make a transfer. The checks include:

1.  **Business type**: We check if your business is a [starter business](https://support.paystack.com/hc/en-us/articles/360009972719-What-is-a-Paystack-Starter-Business-) or a [registered business](https://support.paystack.com/hc/en-us/articles/360009881200-What-is-a-Paystack-Registered-Business-). Only registered businesses are allowed to use the transfer feature. Starter businesses can be [upgraded to a registered business](https://support.paystack.com/hc/en-us/articles/360009881960-How-to-upgrade-from-a-Paystack-Starter-Business-to-a-Paystack-Registered-Business) to use the transfer feature.
2.  **Payout on hold**: An integration payout might be on hold for different reasons. Transfer can't be processed when payout is on hold.
3.  **Invalid amount**: An amount is invalid if it’s below the minimum transfer amount or above the maximum transfer amount. You should confirm the [allowable transfer amount](https://support.paystack.com/hc/en-us/articles/360012276559-Transfers) before making a transfer request.
4.  **Recipient validity**: This check is to ensure the recipient code and details are valid.
5.  **Balance sufficiency**: Before a transfer can be performed, we check if you have the transfer amount plus the transfer fee in your Paystack balance.

If any of the validation checks fails, we return an error message with the cause of the error.

##### Transfer not found

If you call the Verify Transfer endpoint at this stage, you’ll get an error because the transfer hasn’t been created. This is why you should rely on webhooks for updates.

## Transfer creation

On a successful request validation, we need to create a DB entry for the request. To create an entry, we require a transfer reference which is going to be used to keep a track of the transfer lifecycle. If a transfer reference isn’t provided, we go ahead to create one. Else, we use the transfer reference you provided. The transfer is then added to the DB and it’s status set to `pending`.

At this stage, we also deduct the transfer amount and the transfer fee.

##### Generate your transfer reference

Always generate a transfer reference in order to track, manage and reconcile each transfer. Check out how to [Generate a transfer reference](https://paystack.com/docs/transfers/single-transfers/#generate-a-transfer-reference) section to learn more.

## Approval checks

There are two types of approval that can be used to secure a transfer request:

1.  **OTP**: This is a code we send to the merchant’s email and/or phone to confirm that the request was initiated by the merchant.
2.  **URL**: OTP approval requires manual intervention which could be tedious for certain use cases. With URL approval, a merchant creates a verification endpoint that's used to confirm the authenticity of the transfer. For each transfer request, we send an approval request to the merchant’s server to confirm further processing.

As an extra level of security, a merchant might have turned on either or both approval steps. We do a check to confirm is OTP is required or not. If OTP is required, we send an OTP to the merchant’s email and/or phone and set the transfer status to `OTP`. If the OTP isn’t received or used within 30 minutes, we mark the transfer as `abandoned`. If the merchant puts in the wrong the OTP, we mark the transfer as `failed`.

After the OTP process, we check for the URL approval. When we send an approval request to the merchant’s approval URL, we set the transfer status to received while we await a response. The merchant’s server needs to respond with either a 200 or a 400:

| Response code | Meaning | Status |
| --- | --- | --- |
| **200** | Transfer approved | `pending` |
| **400** | Transfer rejected | `rejected` |

If the merchant server doesn’t respond within a few seconds, we mark the transfer as `blocked` and stop further processing.

## Queue transfer

Transfers are added to a queue for multiple reasons. The two primary reasons include:

-   Conforming to the processor’s requirements
-   Resilience

Transfers in the queue are removed in batches and sent to the processor. If we're unable to get a definite response (`success`, `failed`, `reversed`) from the processor, we add the transfer back to the queue. We keep trying until we reach our retry limit. At this point, we mark the transfer as failed. We send a `transfer.failed` event via your webhook URL.

## Await processor

The processor is in charge of pushing the transfer to your customers. They make the request to the customer’s bank to credit the customer’s account. If the processor is able to credit the customer’s account, a successful response is sent back. This is propagated back to your integration via the `transfer.success` event. If we're unable to get conclusive feedback from the processor, we keep retrying till we hit our retry limit. At this point, we mark the transfer as failed and send the `transfer.failed` event.

Sometimes, the processor might send a reversal notice due to their inability to credit the customer’s account. When we get this notice, we send a `transfer.reversed` event and credit your Paystack balance back.

## Troubleshooting

When building or maintaining your transfer integration, you should keep the following integration checklist in mind:

-   Ensure you have enough funds in your Paystack balance to carry out the request(s)
-   Ensure you are sending amount in the smallest denomination of your currency
-   Ensure you have generated a transfer reference
-   Implement a webhook URL to receive updates
-   Ensure the recipient details are valid
-   Ensure there are no long running tasks in your approval URL

Despite checking all items in the checklist, things might still not work as they should. If you encounter any issue with your integration, the first step is to check the status of the transfer.

Typically, issues occur during the validation phase or when there a multiple occurrences of an unsuccessful status. Validation errors come with descriptive messages and solutions are easy to fix. Here are some errors and solutions to them:

| Error | Resolution |
| --- | --- |
| Your reference contains illegal special characters | Ensure that the reference contains lowercase alphanumeric characters and the only special characters are hyphen ("-") and underscore ( "\_") |
| Your balance is not enough to fulfil this request | Top up your Paystack Balance and try again |
| Sorry, we can't make the transfer to this recipient at the moment | The customer should reach out to the bank to resolve the issues with their account |
| Account closed | The customer should reach out to the bank if they didn't close the account |
| Bank code is invalid | Ensure that you're passing the correct bank code. Use the [list bankAPI](https://paystack.com/docs/api/miscellaneous#bank) Endpoint to get the list of all available banks and their corresponding bank codes |

A transfer request could also be stuck in an unsuccessful status. Here’s how to handle unsuccessful status:

1.  `pending`: A transfer might remain in this state for a long time if there is an issue communicating with the recipient's bank. This is one of the reasons why we use queues. We keep retrying through different channels till we've exhausted all options and the transfer fails. You can also [check our status page](https://status.paystack.com/) to confirm that there’s no incident.
2.  `blocked`: This happens when your server fails to respond to approval request within a few seconds. If multiple transfers keeps returning this status. You should check your approval logic to ensure that there are no long running task.
3.  `abandoned`: A high rate of abandoned transfer means there’s an OTP issue. OTP is either not being delivered or you aren't using the OTP within 30 minutes. If you are going to use OTP for approval, we recommend turning on both email and phone channels. This is to increase the chances of OTP delivery.

###### On this Page

-   [Request validation](https://paystack.com/docs/transfers/how-transfers-work/#request-validation)
-   [Transfer creation](https://paystack.com/docs/transfers/how-transfers-work/#transfer-creation)
-   [Approval checks](https://paystack.com/docs/transfers/how-transfers-work/#approval-checks)
-   [Queue transfer](https://paystack.com/docs/transfers/how-transfers-work/#queue-transfer)
-   [Await processor](https://paystack.com/docs/transfers/how-transfers-work/#await-processor)
-   [Troubleshooting](https://paystack.com/docs/transfers/how-transfers-work/#troubleshooting)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)