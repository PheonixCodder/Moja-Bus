# Verify Account Number

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

The account validation APIs allow merchants to confirm the authenticity of a customer’s account number before sending money to the customer.

## Introduction

Before sending money to a customer, you need to ensure the customer’s account details are correct. This is to ensure you aren’t sending money to the wrong person. To achieve this, we provide the following APIs:

| Name | Availability | Description |
| --- | --- | --- |
| [Resolve Account Number](https://paystack.com/docs/identity-verification/verify-account-number/#resolve-account-number) | Nigeria, Ghana | Used for the confirmation of personal bank accounts |
| [Account Validation](https://paystack.com/docs/identity-verification/verify-account-number/#account-validation) | South Africa | Used for the validation of personal and business bank accounts |

Account number verification allows you to:

-   Confirm a customer’s bank details before creating a transfer recipient
-   Automate your KYC process

## Resolve account number

##### Gentle reminder

This feature is available to business in Nigeria and Ghana.

The [Resolve Account NumberAPI](https://paystack.com/docs/api/verification#resolve-account) takes the customer’s account number and bank code and returns the account details of the customer. To resolve an account number, make a `GET` request to the `/bank/resolve` endpoint:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/bank/resolve?account_number=0001234567&bank_code=0582-H "Authorization: Bearer YOUR_SECRET_KEY"3-X GET
```

```
1{2  "status": true,3  "message": "Account number resolved",4  "data": {5    "account_number": "0001234567",6    "account_name": "Doe Jane Loren",7    "bank_id": 98  }9}
```

##### Pricing

This endpoint is free for use.

## Account validation

##### Gentle Reminder

This feature is only available to businesses in South Africa.

The [Validate AccountAPI](https://paystack.com/docs/api/verification#validate-account) allows merchant validate both personal and business accounts. It checks if the provided customer’s details are correct and returns the status of the check. However, not all banks support account verification, so you need to confirm if the customer's bank supports it.

### Fetch supported banks

To confirm the banks that supports account validation, make a request to the [List BankAPI](https://paystack.com/docs/api/miscellaneous/#bank) endpoint, passing the `enabled_for_verification` query parameter:

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/bank?currency=ZAR&enabled_for_verification=true2-H "Authorization: Bearer YOUR_SECRET_KEY"3-X GET
```

```
1{2  "status": true,3  "message": "Banks retrieved",4  "data": [5    {6      "id": 140,7      "name": "Absa Bank Limited, South Africa",8      "slug": "absa-za",9      "code": "632005",10      "longcode": "632005",11      "gateway": null,12      "pay_with_bank": false,13      "active": true,14      "country": "South Africa",15      "currency": "ZAR",16      "type": "basa",17      "is_deleted": false,18      "createdAt": "2020-09-04T10:38:56.000Z",19      "updatedAt": null,20      "supported_types": [21        "business",22        "personal"23      ]24    },25    {26      "id": 141,27      "name": "African Bank Limited",28      "slug": "african-bank-za",29      "code": "430000",30      "longcode": "430000",31      "gateway": null,32      "pay_with_bank": false,33      "active": true,34      "country": "South Africa",35      "currency": "ZAR",36      "type": "basa",37      "is_deleted": false,38      "createdAt": "2020-09-04T10:38:56.000Z",39      "updatedAt": null,40      "supported_types": [41        "business",42        "personal"43      ]44    },45    {46      "id": 146,47      "name": "Capitec Bank Limited",48      "slug": "capitec-bank-za",49      "code": "470010",50      "longcode": "470010",51      "gateway": null,52      "pay_with_bank": false,53      "active": true,54      "country": "South Africa",55      "currency": "ZAR",56      "type": "basa",57      "is_deleted": false,58      "createdAt": "2020-09-04T10:38:56.000Z",59      "updatedAt": null,60      "supported_types": [61        "personal"62      ]63    },64    {65      "id": 147,66      "name": "Discovery Bank Limited",67      "slug": "discovery-bank-za",68      "code": "679000",69      "longcode": "679000",70      "gateway": null,71      "pay_with_bank": false,72      "active": true,73      "country": "South Africa",74      "currency": "ZAR",75      "type": "basa",76      "is_deleted": false,77      "createdAt": "2020-09-04T10:38:56.000Z",78      "updatedAt": null,79      "supported_types": [80        "business",81        "personal"82      ]83    },84    {85      "id": 151,86      "name": "First National Bank",87      "slug": "first-national-bank-za",88      "code": "250655",89      "longcode": "250655",90      "gateway": null,91      "pay_with_bank": false,92      "active": true,93      "country": "South Africa",94      "currency": "ZAR",95      "type": "basa",96      "is_deleted": false,97      "createdAt": "2020-09-04T10:38:56.000Z",98      "updatedAt": null,99      "supported_types": [100        "business",101        "personal"102      ]103    },104    {105      "id": 152,106      "name": "Grindrod Bank",107      "slug": "grindrod-bank-za",108      "code": "584000",109      "longcode": "584000",110      "gateway": null,111      "pay_with_bank": false,112      "active": true,113      "country": "South Africa",114      "currency": "ZAR",115      "type": "basa",116      "is_deleted": false,117      "createdAt": "2020-09-04T10:38:56.000Z",118      "updatedAt": null,119      "supported_types": [120        "business",121        "personal"122      ]123    },124    {125      "id": 153,126      "name": "Investec Bank Ltd",127      "slug": "investec-bank-za",128      "code": "580105",129      "longcode": "580105",130      "gateway": null,131      "pay_with_bank": false,132      "active": true,133      "country": "South Africa",134      "currency": "ZAR",135      "type": "basa",136      "is_deleted": false,137      "createdAt": "2020-09-04T10:38:56.000Z",138      "updatedAt": null,139      "supported_types": [140        "business",141        "personal"142      ]143    },144    {145      "id": 157,146      "name": "Nedbank",147      "slug": "nedbank-za",148      "code": "198765",149      "longcode": "198765",150      "gateway": null,151      "pay_with_bank": false,152      "active": true,153      "country": "South Africa",154      "currency": "ZAR",155      "type": "basa",156      "is_deleted": false,157      "createdAt": "2020-09-04T10:38:56.000Z",158      "updatedAt": null,159      "supported_types": [160        "business",161        "personal"162      ]163    },164    {165      "id": 161,166      "name": "SASFIN Bank",167      "slug": "sasfin-bank-za",168      "code": "683000",169      "longcode": "683000",170      "gateway": null,171      "pay_with_bank": false,172      "active": true,173      "country": "South Africa",174      "currency": "ZAR",175      "type": "basa",176      "is_deleted": false,177      "createdAt": "2020-09-04T10:38:56.000Z",178      "updatedAt": null,179      "supported_types": [180        "business",181        "personal"182      ]183    },184    {185      "id": 163,186      "name": "Standard Bank South Africa",187      "slug": "standard-bank-za",188      "code": "051001",189      "longcode": "051001",190      "gateway": null,191      "pay_with_bank": false,192      "active": true,193      "country": "South Africa",194      "currency": "ZAR",195      "type": "basa",196      "is_deleted": false,197      "createdAt": "2020-09-04T10:38:56.000Z",198      "updatedAt": null,199      "supported_types": [200        "business",201        "personal"202      ]203    },204    {205      "id": 165,206      "name": "TymeBank",207      "slug": "tymebank-za",208      "code": "678910",209      "longcode": "678910",210      "gateway": null,211      "pay_with_bank": false,212      "active": true,213      "country": "South Africa",214      "currency": "ZAR",215      "type": "basa",216      "is_deleted": false,217      "createdAt": "2020-09-04T10:38:56.000Z",218      "updatedAt": null,219      "supported_types": [220        "business",221        "personal"222      ]223    }224  ]225}
```

The `data` object in the response contains the banks that support account validation. The `supported_types` in each bank object contains an array of the account type that can be validated. Some banks only support personal accounts while others support both personal and business accounts. If the customer's bank is returned in this response, then you can go ahead with account validation, else, the account validation can be skipped.

### Validate account

To validate an account, make a `POST` request to the [Validate AccountAPI](https://paystack.com/docs/api/verification#validate-account) endpoint. This endpoint can be used for both personal and business account validation by using the following request parameters:

| Name | Type | Description |
| --- | --- | --- |
| `account_name` | String | Customer's first and last name registered with their bank |
| `account_number` | String | Customer’s account number |
| `account_type` | String | This can take one of: \[`personal`, `business`\] |
| `bank_code` | String | The bank code of the customer’s bank. You can fetch the bank codes by using the [List BankAPI](https://paystack.com/docs/api/miscellaneous#bank). |
| `country_code` | String | The two digit ISO code of the customer’s bank |
| `document_type` | String | Customer’s mode of identity. This could be one of: \[`identityNumber`, `passportNumber`, `businessRegistrationNumber`\] |
| `document_number` | String | Customer’s mode of identity number |

When validating a personal account number, the customer can either provide their passport or identity number. You can specify the mode of identity by passing either `identityNumber` or `passportNumber` as the `document_type` parameter.

For business account validation the `document_type` should be `businessRegistrationNumber`.

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/bank/validate2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ 5      "bank_code": "632005",6      "country_code": "ZA",7      "account_number": "0123456789",8      "account_name": "Ann Bron",9      "account_type": "personal",10      "document_type": "identityNumber",11      "document_number": "1234567890123"12    }'13-X POST
```

```
1{2  "status": true,3  "message": "Personal Account Verification attempted",4  "data": {5    "accountAcceptsDebits": true,6    "accountAcceptsCredits": true,7    "accountHolderMatch": true,8    "accountOpenForMoreThanThreeMonths": true,9    "accountOpen": true,10    "verified": true,11    "verificationMessage": "Account is verified successfully"12  }13}
```

The response contains fields that describe the account capabilities and the validation status. Use these fields to determine whether the account meets your expectations.

| Name | Type | Description |
| --- | --- | --- |
| `accountAcceptsDebits` | boolean | Indicates that the account can accept Debit orders |
| `accountAcceptsCredits` | boolean | The account can accept credits. This is useful when you want to make use of the [TransfersAPI](https://paystack.com/docs/api/transfer). |
| `accountOpenForMoreThanThreeMonths` | boolean | The bank account has been open for more than three months. |
| `accountHolderMatch` | boolean | The account holder details matches the provided identity number or business registration number. |
| `accountOpen` | boolean | Indicates the account is still open and functional. Some accounts could be dormant as such Debit Orders or Transfers may fail. |

##### Pricing

This endpoint costs **ZAR 3** per successful request regardless of the account validation status.

###### On this Page

-   [Introduction](https://paystack.com/docs/identity-verification/verify-account-number/#introduction)
-   [Resolve account number](https://paystack.com/docs/identity-verification/verify-account-number/#resolve-account-number)
-   [Account validation](https://paystack.com/docs/identity-verification/verify-account-number/#account-validation)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)