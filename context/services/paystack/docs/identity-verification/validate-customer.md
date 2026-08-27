# Validate Customer

Learn how to validate identification details for your customers

##### Availability

This is only required if you're using the [Dedicated Virtual Accounts](https://paystack.com/docs/payments/dedicated-virtual-accounts/) feature and your business falls under any of these categories - Betting, Financial services, and General Services.

## Introduction

The customer validation endpoint is used to verify identification details provided by your customers. You can validate a customer by sending a `POST` request to the [Validate CustomerAPI](https://paystack.com/docs/api/customer#validate) endpoint.

## Bank account validation

Bank account validation requires that you provide the customer's BVN and a bank account connected to that BVN.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/customer/{customer_code}/identification2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5	"country": "NG",6	"type": "bank_account",7	"account_number": "0123456789",8	"bvn": "200123456677",9	"bank_code": "007",10	"first_name": "Asta",11	"last_name": "Lavista"12}'13-X POST
```

```
1{2  "status": true,3  "message": "Customer Identification in progress"4}
```

### Testing

Customers can only be validated with live keys. However, for testing purposes during your integration, you can make make use of this credential with your test key:

-   Test Credential

```
1{2  "country": "NG",3  "type": "bank_account",4  "account_number": "0111111111",5  "bvn": "222222222221",6  "bank_code": "007",7  "first_name": "Uchenna",8  "last_name": "Okoro"9}
```

## Listen for verification status

The verification of the details provided happens asynchronously, and we will send a `customeridentification.success` or `customeridentification.failed` event to your webhook URL when the verification is complete.

##### Prerequisite

You need a basic knowledge of [webhooks](https://paystack.com/docs/payments/webhooks/) before proceeding with this section.

-   Customer Identification Success
-   Customer Identification Failed

```
1{2  "event": "customeridentification.success",3  "data": {4    "customer_id": "9387490384",5    "customer_code": "CUS_xnxdt6s1zg1f4nx",6    "email": "bojack@horsinaround.com",7    "identification": {8      "country": "NG",9      "type": "bank_account",10      "bvn": "200*****677",11      "account_number": "012****789",12      "bank_code": "007"13    }14  }15}
```

When a customer validation fails, we return the cause of the failure in the `data.reason` parameter. We return the following reasons for a failed customer validation:

1.  Account couldn't be resolved. Please try again
2.  Account name or BVN is incorrect
3.  Account number or BVN is incorrect

##### A validated customer's name can't be updated

When a customer is validated successfully, the customer's `first_name` and `last_name` are automatically updated to correspond with the name on their BVN. Once this is set, you'll no longer be able to update the customer's name using the [Update CustomerAPI](https://paystack.com/docs/api/customer#update) and the customer's name can only be updated by a re-validation.

## Reasons to validate a customer

1.  Local regulations require that customer information is validated before creating account numbers on their behalf.
2.  It allows us name the bank account using the name registered to the provided BVN.

###### On this Page

-   [Introduction](https://paystack.com/docs/identity-verification/validate-customer/#introduction)
-   [Bank account validation](https://paystack.com/docs/identity-verification/validate-customer/#bank-account-validation)
-   [Listen for verification status](https://paystack.com/docs/identity-verification/validate-customer/#listen-for-verification-status)
-   [Reasons to validate a customer](https://paystack.com/docs/identity-verification/validate-customer/#reasons-to-validate-a-customer)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)