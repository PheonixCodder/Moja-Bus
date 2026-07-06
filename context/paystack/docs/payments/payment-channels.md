# Payment Channels

    .cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

Paystack enables you accept payments from customers using different payment channels such as: cards, mobile money accounts, QR codes, directly from their bank account or USSD.

    If you use the the [Popup](https://paystack.com/docs/payments/accept-payments/#popup) or [Redirect](https://paystack.com/docs/payments/accept-payments/#redirect) method, the paying customer will be shown all the payment methods selected on your [dashboard](https://dashboard.paystack.com/#/settings/preferences). But if you don't want to use either option, you can initiate all the different payment channels directly from your server using the [Charge API](https://paystack.com/docs/payments/accept-payments/#charge-api).

##### What channels are available?

    Card payment channels are available on all Paystack accounts, while the other payment channels are only available in countries where they're supported.

## Cards

Cards are one of the common payment channels in a lot of countries. We support the following cards across our markets:

    | Card | Markets |
| --- | --- |
| Visa | All |
| Mastercard | All |
| Verve | Nigeria |
| Amex | Nigeria, South Africa and Kenya |

##### Feature Availability

The Card API is available in all our markets for businesses that are [PCI Compliant](https://www.pcisecuritystandards.org/). If you intend to use this API, you should check the compliance requirements outlined below and reach out to us.

                                                                                     The Cards API allows you to send card details securely and compliantly to our server from your custom checkout. With this, PCI-DSS complaint businesses can build bespoke checkout experiences without compromising on security.

    The sensitivity of card details requires businesses to adhere to the **Payment Card Industry Data Security Standards (PCI-DSS)**, to ensure that they're securely processed. Paystack adheres to this as a [PCI Level 1 Service Provider](https://paystack.com/compliance), allowing non-complaint businesses to use our [Checkout](https://paystack.com/docs/payments/accept-payments/#redirect) and [Mobile SDKs](https://paystack.com/docs/developer-tools/) for card payments

### Compliance requirements

PCI-DSS certification documents can only be issued on behalf of the PCI Council by an accredited [Qualified Security Assessor](https://listings.pcisecuritystandards.org/assessors_and_solutions/qualified_security_assessors) (QSA) after an audit.

                                                                                                                               The documents issued by the council are the **Attestation of Compliance** (AOC) and **Report on Compliance.** These documents are only valid for one year from the dated they were signed. We require you to submit these documents before you’re allowed to use this API.

    For Paystack, a valid AOC needs to show the following:

    1.  Issued after an audit by a QSA
2.  Signed off by a QSA
3.  Within one year of issue date
4.  Has the PCI SSC logo on the cover page
5.  Adheres to at least version 3.2.1 of PCI-DSS

If you have met the criteria above please submit your documents to [support@paystack.com](mailto:support@paystack.com) or through your Paystack relationship manager and we'll grant access to the APIs.

## Bank accounts

##### Feature availability

This feature is currently available to businesses in Nigeria.

    The Pay with Bank feature allows customers pay through internet banking portal or by providing their bank account number and authenticating using an OTP sent to their phone or email.

    This is different from Bank Transfers where customers transfer money into a bank account.

### Collect bank details

To collect bank details, you would need to prompt the user to select their bank and enter their account number. To fetch the list of supported banks, make a `GET` request to the [list banksAPI](https://paystack.com/docs/api/miscellaneous#bank) endpoint, with the additional filter `pay_with_bank=true`.

                                                                                                                                                                                                  The banks can be listed in a dropdown or any other format that allows the user to easily pick their bank of choice.

### Create a charge

Send `email`, `amount`, `metadata`, `bank` (an object that includes the `code` of the bank and `account_number` supplied by customer) and `birthday` to our Charge endpoint to start.

    cURLNodePHP

Show Response

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "10000", 6      "bank": {7        "code": "057", 8        "account_number": "0000000000" 9      }10    }'11-X POST
```

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "z8q981z5kp7sfde",6    "status": "send_birthday",7    "display_text": "Please enter your birthday"8  }9}
```

If the selected bank is Kuda, you need to make use of `phone` and `token` instead of `account_number` in the `bank` object:

    cURLNodePHP

Show Response

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "10000", 6      "bank": {7        "code": "50211", 8        "phone": "+2348100000000",9        "token": "123456"10      }11    }'12-X POST13
```

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "z8q981z5kp7sfde",6    "status": "pending",7    "display_text": "Processing transaction"8  }9}
```

When the API call is made, the value of the `data.status` key is `pending` as the payment is being processed in the background. The `data.status` then updates to either, `success` or `failed` depending on whether the transaction was successful or not.

## Pay with Transfer

    ##### Feature availability

This feature is currently available to businesses in Nigeria.

    Pay with Transfer (PwT) is a feature that allow merchants or businesses create temporary bank accounts that customers can use to pay for goods or services. The account number is generated and tied to the current customer’s transaction. The account number becomes invalid after the customer’s transaction or when it exceeds it’s expiry time.

### Create a PwT charge

At the point of payment, you initiate a request to the [Create ChargeAPI](https://paystack.com/docs/api/charge#create) endpoint, passing the `email`, `amount` and `bank_transfer` object. The `bank_transfer` object takes the `account_expires_at` which is used to set the expiry of an account number for a transaction:

                                                                          cURLNodePHP

Show Response

    ```
1#!/bin/sh2
3url="https://api.paystack.co/charge"4authorization="Authorization: Bearer YOUR_SECRET_KEY"5content_type="Content-Type: application/json"6data='{ 7  "email": "another@one.com", 8  "amount": "10000", 9  "bank_transfer": {10    "account_expires_at": "2025-04-24T16:40:57.954Z"11  } 12}'13
14curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "kcvu0t3kzs",6    "status": "pending_bank_transfer",7    "display_text": "Please make a transfer to the account specified",8    "account_name": "TEST-MANAGED-ACCOUNT",9    "account_number": "1260257501",10    "bank": {11      "slug": "test-bank",12      "name": "Test Bank",13      "id": 2414    },15    "account_expires_at": "2025-04-24T16:40:57.954Z"16  }17}
```

| Bank Transfer Param | Type | Description |
| --- | --- | --- |
| `account_expires_at` | String | Account validity period in ISO 8601 format (`YYYY-MM-DDThh:mm:ssZ`). Minimum time is 15 mins from the current time and maximum time is 8 hours from the current time. You can also set this to `null` so we automatically set it to 8 hours from the current time. |

##### Account expiry

If the difference between `account_expires_at` and the current time is **less than 15 mins** we will default to a **15 mins**. If the difference between `account_expires_at` and the current time **exceeds 8 hours** we will default to **8 hours**.

If you need to control the transfers your business receives you should implement [Inbound Transfer Approvals](https://paystack.com/docs/payments/dedicated-virtual-accounts/#inbound-transfer-approval) . This enables you to reject or accept transfers based on your various business requirements.

### Verifying transfer

##### Receiving notifications

To receive notifications, you need to [implement a webhook URL](https://paystack.com/docs/payments/webhooks/) and set the webhook URL on your Paystack [dashboard](https://dashboard.paystack.com/#/settings/developer) or [canvas](https://dashboard.paystack.com/v2/developers).

                                                                A bank transfer is initiated by a customer and processed by their bank. To confirm payment, you need to implement webhooks and listen to the following events:

    | Event | Description |
| --- | --- |
| `charge.success` | This is sent when the customer’s transfer is successful. |
| `bank.transfer.rejected` | This is sent when the customer either sent an incorrect amount or when the customer has been flagged by our fraud system. |

-   Charge Successful
-   Transfer Rejected

    ```
1{2  "event": "charge.success",3  "data": {4    "id": 3104021987,5    "domain": "test",6    "status": "success",7    "reference": "zuz8ggd1ro",8    "amount": 25000,9    "message": null,10    "gateway_response": "Approved",11    "paid_at": "2023-09-12T13:29:09.000Z",12    "created_at": "2023-09-12T13:27:50.000Z",13    "channel": "bank_transfer",14    "currency": "NGN",15    "ip_address": "172.91.42.100",16    "metadata": "",17    "fees_breakdown": null,18    "log": null,19    "fees": 375,20    "fees_split": null,21    "authorization": {22      "authorization_code": "AUTH_q5nfynycgm",23      "bin": "008XXX",24      "last4": "X553",25      "exp_month": "09",26      "exp_year": "2023",27      "channel": "bank_transfer",28      "card_type": "transfer",29      "bank": null,30      "country_code": "NG",31      "brand": "Managed Account",32      "reusable": false,33      "signature": null,34      "account_name": null,35      "sender_country": "NG",36      "sender_bank": null,37      "sender_bank_account_number": "XXXXXXX553",38      "sender_name": "Jadesola Oluwashina",39      "narration": "Channel Tests"40    },41    "customer": {42      "id": 138496675,43      "first_name": null,44      "last_name": null,45      "email": "another@one.com",46      "customer_code": "CUS_1eq06yu8efl8u63",47      "phone": null,48      "metadata": null,49      "risk_action": "default",50      "international_format_phone": null51    },52    "plan": {},53    "subaccount": {},54    "split": {},55    "order_id": null,56    "paidAt": "2023-09-12T13:29:09.000Z",57    "requested_amount": 25000,58    "pos_transaction_data": null,59    "source": {60      "type": "api",61      "source": "merchant_api",62      "entry_point": "charge",63      "identifier": null64    }65  }66}
```

Alternatively, you can use the [Check Pending ChargeAPI](https://paystack.com/docs/api/charge#check) endpoint to manually verify the status of the transaction.

## USSD

This Payment method is specifically for Nigerian customers. Nigerian Banks provide USSD services that customers use to perform transactions, and we've integrated with some of them to enable customers complete payments.

The Pay via USSD channel allows your Nigerian customers to pay you by dialling a USSD code on their mobile device. This code is usually in the form of `* followed by some code and ending with #`. The user is prompted to authenticate the transaction with a PIN and then it's confirmed.

All you need to initiate a USSD charge is the customer email and the amount to charge.

    When the user pays, a response will be sent to your webhook. Hence, for this to work properly as expected, webhooks must be set up on your Paystack Dashboard.

### Create a charge

Send an email and amount to the [chargeAPI](https://paystack.com/docs/api/charge) endpoint with the USSD type you are charging. The table below shows the types that are supported.

| Bank | Type |
| --- | --- |
| Guaranty Trust Bank | 737 |

cURLNodePHP

Show Response

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "some@body.nice", 5      "amount":"10000",6      "ussd": {7        "type": "737"8      },9      "metadata": {10        "custom_fields":[{11          "value": "makurdi",12          "display_name": "Donation for",13          "variable_name": "donation_for"14        }]15      }16    }'17-X POST
```

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "yjr1r8rwhedara4",6    "status": "pay_offline",7    "display_text": "Please dial *737*33*4*18791# on your mobile phone to complete the transaction",8    "ussd_code": "*737*33*4*18791#"9  }10}
```

When a charge is made, the default response provides a USSD code for the customer to dial to complete the payment.

### Handle response

When the user completes payment, a response is sent to the merchant’s webhook. Hence, for this to work properly as expected, webhooks must be set up for the merchant..

    The `charge.success` event is raised on successful payment. The sample response to be sent to the user’s webhook would look like:

    -   JSON

        ```
1{2  "event": "charge.success",3  "data": {4    "id": 53561,5    "domain": "live",6    "status": "success",7    "reference": "2ofkbk0yie6dvzb",8    "amount": 150000,9    "message": "madePayment",10    "gateway_response": "Payment successful",11    "paid_at": "2018-06-25T12:42:58.000Z",12    "created_at": "2018-06-25T12:38:59.000Z",13    "channel": "ussd",14    "currency": "NGN",15    "ip_address": "54.246.237.22, 162.158.38.185, 172.31.15.210",16    "metadata": "",17    "log": null,18    "fees": null,19    "fees_split": null,20    "authorization": {21      "authorization_code": "AUTH_4c6mhnmmeusp4yd",22      "bin": "XXXXXX",23      "last4": "XXXX",24      "exp_month": "05",25      "exp_year": "2018",26      "channel": "ussd",27      "card_type": "offline",28      "bank": "Guaranty Trust Bank",29      "country_code": "NG",30      "brand": "offline",31      "reusable": false,32      "signature": null,33      "account_name": null34    },35    "customer": {36      "id": 16200,37      "first_name": "John",38      "last_name": "Doe",39      "email": "customer@email.com",40      "customer_code": "CUS_bpy9ciomcstg55y",41      "phone": "",42      "metadata": null,43      "risk_action": "default"44    },45    "plan": {},46    "subaccount": {},47    "paidAt": "2018-06-25T12:42:58.000Z"48  }49}
```

##### USSD recurring charge

Charging returning customers directly isn't currently available. Simply call the endpoint to start a new transaction.

## Mobile money

##### Feature Availability

This feature is only available to businesses in Ghana, Kenya, and Côte d'Ivoire.

The Mobile Money channel allows your customers to pay you by using their phone number enabled for mobile money. At the point of payment, the customer is required to authorize the payment on the mobile phones.

    Since payment is completed offline, you need to have a [webhook URL](https://paystack.com/docs/payments/webhooks/)  which we’ll use to send the final status of the payment to your server.

### Create a charge

To initiate a charge for mobile money, you need to make a `POST` request to the [chargeAPI](https://paystack.com/docs/api/charge) passing the customer’s `email`, `amount`, and `mobile_money` object:

cURLNodePHP

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "amount": 100,5      "email": "customer@email.com",6      "currency": "GHS",7      "mobile_money": {8        "phone" : "0551234987",9        "provider" : "mtn"10      }11    }'12-X POST
```

##### Sample code for other providers

This sample code above shows how to charge any MoMo providers. You simply [change the currency](https://paystack.com/docs/api/#supported-currency) and replace the `mtn` in the `mobile_money` object with any other provider code shown in the table below.

#### Provider code

Here are the character codes for the supported mobile money providers:

    | Provider | Code | Country |
| --- | --- | --- |
| MTN | `mtn` | Ghana and CIV |
| ATMoney & Airtel Money | `atl` | Ghana and Kenya |
| Telecel | `vod` | Ghana |
| M-PESA | `mpesa` | Kenya |
| Orange | `orange` | CIV |
| Wave | `wave` | CIV |

When you initiate the request, the response contains a `data.status` field with a value of `pay_offline`. The customer is also prompted to authorise the transaction on their phones. You should show the customer the `data.display_text` and then listen for the `charge.success` webhook event. The customer needs to complete the transaction within **180 seconds**, after which the transactions fail. This is a limitation set by the network providers.

    Here is a sample response that requires the customer to complete the process offline:

    -   JSON

        ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "8nn5fqljd0suybr",6    "status": "pay_offline",7    "display_text": "Please complete authorization process on your mobile phone"8  }9}
```

##### Transaction Verification

If you don't get the `charge.success` webhook event after 180 seconds, you should call the [Verify TransactionAPI](https://paystack.com/docs/api/transaction#verify) endpoint to get the status and reason of the transaction failure, found in the `data.message` parameter in the response.

### M-PESA

##### Feature Availability

M-PESA allows Kenya-based businesses to charge individual customers and M-PESA Till numbers.

    With M-PESA merchants can charge individual users by sending an STK push to the number provided. We recommend that you include the country code in the phone number. For example, `0722000000` should be sent as `+254722000000` to the [chargeAPI](https://paystack.com/docs/api/charge) endpoint. The customer will be prompted to enter their PIN to complete the transaction.

-   JSON

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "8nn5fqljd0suybr",6    "status": "pay_offline",7    "display_text": "Please complete authorization process on your mobile phone"8  }9}
```

#### M-PESA Offline

The offline option allows businesses to create a [chargeAPI](https://paystack.com/docs/api/charge) that will be completed later. This is useful for businesses that offer payment after service completion, for example: restaurants, e-commerce stores, delivery & logistics services. The customer will pay to Paystack's Paybill and the generated `account_reference` will identify the transaction. Another benefit to businesses is the transaction can’t be completed with the wrong amount. It’ll fail and the customer will have to start again.

cURLNodePHP

Show Response

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "amount": 100,5      "email": "customer@email.com",6      "currency": "KES",7      "mobile_money": {8        "phone": "254700000000",9        "provider" : "mpesa_offline"10      }11    }'12-X POST
```

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "e6i9ak3rbq982wh",6    "status": "pay_offline",7    "display_text": "Please complete authorization process on your mobile phone",8    "account_number": "4084333",9    "account_reference": 123456710  }11}
```

The `acount_number` is the Paybill number while the `account_reference` uniquely identifies the transaction. In case you need to change the amount, you should create a new charge and share the new details with the customer. Wrong amounts will lead to transaction failure.

#### M-PESA Till

You can also get paid by other businesses from their M-PESA Till numbers. The `mobile_money` object should have `provider` set to `mptill` and the `account` which is the other business's M-PESA Till number. They will receive a prompt on the phone assigned the till for authorization.

cURLNodePHP

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "amount": 100,5      "email": "customer@email.com",6      "currency": "KES",7      "mobile_money": {8        "account" : "1234567",9        "provider" : "mptill"10      }11    }'12-X POST
```

Both M-PESA Till and individual require the customer to authorise the transaction on their phones. As such you should show them the `display_text` value when building a custom experience.

-   JSON

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "jq3psd5n96sprwl",6    "status": "pay_offline",7    "display_text": "Please complete authorization process on your mobile phone"8  }9}
```

##### Transaction Verification

Since M-PESA transactions happen asynchronously, failures due to customer errors aren’t captured easily. We recommend you implement [Verify Transactions](https://paystack.com/docs/payments/verify-payments/) when they take too long to get completed.

### Handle response

When the user completes payment, a response is sent to the merchant’s webhook. Hence, for this to work properly as expected, webhooks must be set up for the merchant.

    The `charge.success` event is raised on successful payment. The sample response to be sent to the user’s webhook would look like:

    -   JSON

        ```
1{2  "event": "charge.success",3  "data": {4    "id": 59214,5    "domain": "live",6    "status": "success",7    "reference": "gf4n3ykzj6a7u89",8    "amount": 100,9    "message": "madePayment",10    "gateway_response": "Approved",11    "paid_at": "2018-11-15T06:10:54.000Z",12    "created_at": "2018-11-15T06:10:32.000Z",13    "channel": "mobile_money",14    "currency": "GHS",15    "ip_address": "18.130.236.148, 141.101.99.73",16    "metadata": "",17    "log": null,18    "fees": 153,19    "fees_split": null,20    "authorization": {21      "authorization_code": "AUTH_0aqm8ddx6s",22      "bin": "055XXX",23      "last4": "X149",24      "exp_month": "12",25      "exp_year": "9999",26      "channel": "mobile_money",27      "card_type": "",28      "bank": "MTN Mobile Money",29      "country_code": "GH",30      "brand": "Mtn mobile money",31      "reusable": false,32      "signature": null,33      "account_name": "BoJack Horseman"34    },35    "customer": {36      "id": 16678,37      "first_name": "Babafemi",38      "last_name": "Aluko",39      "email": "customer@email.com",40      "customer_code": "CUS_2jk1i8ezoam49br",41      "phone": "",42      "metadata": null,43      "risk_action": "allow"44    },45    "plan": {},46    "subaccount": {},47    "subaccount_group": {},48    "paidAt": "2018-11-15T06:10:54.000Z"49  }50}
```

Charging returning customers directly isn't currently available. Simply call the endpoint to start a new transaction. We have some [test credentials](https://paystack.com/docs/payments/test-payments/#mobile-money) that can be used to run some tests.

## EFT

EFT payments are an instant bank transfer payment method where customers pay merchants through their internet banking interfaces. When the developer specifies an EFT provider, we do a redirect to the providers platform where the customer provides their payment details after which the payment is authorized.

##### Where is this available?

    This feature is only available to South African customers.

### Create a charge

You need to send the `email`, `amount`, `currency`, and the EFT provider to the [chargeAPI](https://paystack.com/docs/api/charge) endpoint:

cURLNodePHP

Show Response

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{5      "amount": 5000,6      "currency": "ZAR",7      "email": "customer@email.com",8      "eft": {9        "provider": "ozow"10      }11}'12-X POST
```

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "18c0ywb63zutno0",6    "status": "open_url",7    "url": "https://crayon.paystack.co/eft/EFT_OZOW/121502"8  }9}
```

##### Available Providers

Ozow is currently the only provider available.

### Handle response

When the user completes payment, a response is sent to the merchant’s webhook. The merchant needs to setup webhooks to get the status of the payment. The `charge.success` event is raised on successful payment.

## Pay with Pesalink

    ##### Feature Availability

This feature is available for registered Kenyan based businesses. You’ll need to reach out to [support@paystack.com](mailto:support@paystack.com) for enablement.

                                                                                                                                                          Pesalink channel enables customers to make instant transfers from their banking platform. Each transaction has an account number and narration or reason for your customer to use as part of completing the payment.

##### Account Validity

The account is valid for 25 minutes. You need to communicate this timeout to the customer to avoid any reconciliation issues. Customers with accounts in **Diamond Trust Bank (DTB)** can't make transfers via this channel.

### Create a charge

At the point of payment, you initiate a request to the [chargeAPI](https://paystack.com/docs/api/charge) endpoint, passing the `email`, `amount` and `bank_transfer` object. The `bank_transfer` object takes an `account_expires_at` parameter, which can be `null` or less than 25 minutes from the current time in UTC.

If the difference between `account_expires_at` and the current time **exceeds 25 minutes** the default becomes **25 minutes**.

cURLNodePHP

Show Response

    ```
1#!/bin/sh2
3url="https://api.paystack.co/charge"4authorization="Authorization: Bearer YOUR_SECRET_KEY"5content_type="Content-Type: application/json"6data='{ 7  "email": "user@example.com", 8  "amount": "10000", 9  "bank_transfer": {10    "account_expires_at": "2025-04-24T16:40:57.954Z"11  } 12}'13
14curl "$url" -H "$authorization" -H "$content_type" -d "$data" -X POST
```

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "kcvu0t3kzs",6    "status": "pending_bank_transfer",7    "display_text": "Please make a transfer to the account specified",8    "account_name": "Paystack Payments Kenya Limited",9    "account_number": "1234567891",10    "bank": {11      "slug": "dtbk-bank",12      "name": "Diamond Trust Bank Kenya Ltd",13      "id": 22514    },15    "account_expires_at": "2025-04-24T16:55:57.954Z",16    "amount": 10000,17    "transaction_reference": "1234567"18  }19}
```

##### Transaction Reference

Always ensure you show the `transaction_reference` to the customers. The customer will use it as the narration or reason while making the transfer. This is needed for the transaction to be identified properly.

### Handle response

##### Receiving notifications

To receive notifications, you need to [implement a webhook URL](https://paystack.com/docs/payments/webhooks/) and set the webhook URL on your Paystack [dashboard](https://dashboard.paystack.com/#/settings/developer) or [canvas](https://dashboard.paystack.com/v2/developers).

                                                                When the customer completes payment, a response is sent to your webhook URL. This is the `charge.success` event, which indicates the payment was successful. In cases where the customer sends an incorrect amount, we send the `bank.transfer.rejected`event. You should notify the customer to retry the payment with the correct amount. A refund is automatically processed if the customer sends an invalid amount.

-   Charge Successful
-   Transfer Rejected

    ```
1{2  "event": "charge.success",3  "data": {4    "id": 519558290,5    "domain": "live",6    "status": "success",7    "reference": "uybxnzf71231",8    "amount": 1000,9    "message": null,10    "gateway_response": "Approved",11    "paid_at": "2025-06-21T11:11:27.000Z",12    "created_at": "2025-06-21T11:02:57.000Z",13    "channel": "bank_transfer",14    "currency": "KES",15    "ip_address": "172.68.67.162, 172.31.63.81",16    "metadata": 0,17    "fees_breakdown": {18      "amount": "15",19      "formula": null,20      "type": "paystack"21    },22    "log": null,23    "fees": 15,24    "fees_split": null,25    "authorization": {26      "authorization_code": "AUTH_9q100f8qle",27      "bin": "010XXX",28      "last4": "X607",29      "exp_month": "06",30      "exp_year": "2025",31      "channel": "bank_transfer",32      "card_type": "transfer",33      "bank": "Diamond Trust Bank Limited",34      "country_code": "KE",35      "brand": "Managed Account",36      "reusable": false,37      "signature": null,38      "account_name": null,39      "sender_country": "KE",40      "sender_bank": "Diamond Trust Bank Kenya Limited",41      "sender_bank_account_number": "XXXXXXX607",42      "sender_name": "ANN ABELL",43      "narration": null,44      "receiver_bank_account_number": "0123456789",45      "receiver_bank": "Diamond Trust Bank Kenya Ltd"46    },47    "customer": {48      "id": 181595312,49      "first_name": "Ann",50      "last_name": "Abell",51      "email": "user@example.com",52      "customer_code": "CUS_174rg4huaih38hk",53      "phone": null,54      "metadata": null,55      "risk_action": "default",56      "international_format_phone": null57    },58    "plan": {},59    "subaccount": {},60    "split": {},61    "order_id": null,62    "paidAt": "2025-04-24T16:55:57.954Z",63    "requested_amount": 1000,64    "pos_transaction_data": null,65    "source": {66      "type": "api",67      "source": "merchant_api",68      "entry_point": "charge",69      "identifier": null70    }71  }72}
```

## QR code

##### Feature Availability

QR code payments are available to businesses in South Africa only. It works with both **SnapScan** and **Scan to Pay** [supported apps](https://paystack.com/docs/payments/payment-channels/#scan-to-pay)

The QR channel generates a QR code that allows customers to complete payments on their mobile app. When the customer scans the code, they authenticate on a [supported app](https://paystack.com/docs/payments/payment-channels/#supported-apps) to complete the payment.

                                                                                                                                                                            When they completes the transaction, a `charge.success` event is sent to your webhook URL. You need to implement [webhooks](https://paystack.com/docs/payments/webhooks/) on your server to receive the event and update your customer.

### Create a charge

Send an email and amount to the [chargeAPI](https://paystack.com/docs/api/charge) endpoint along with a `qr` object. The `qr` object should have the `provider` parameter set to `scan-to-pay`.

cURLNodePHP

Show Response

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "amount": 1000,5      "email": "customer@email.com",6      "currency": "ZAR",7      "qr": {8        "provider" : "scan-to-pay"9      }10    }'11-X POST
```

    ```
1{2  "status": true,3  "message": "Charge attempted",4  "data": {5    "reference": "48rx32f1womvcr4",6    "status": "pay_offline",7    "qr_code": "0002010216421527000104176552045499530356654031005802NG5920Babafemi enterprises6005Lagos62230519PSTK_104176000926|16304713a",8    "url": "https://files.paystack.co/qr/visa/104176/Babafemi_enterprises_visaqr_1544025482956.png"9  }10}
```

### Handle response

When the user completes payment, the `charge.success` event is sent to your webhook URL. The sample below shows how the event would look like:

    -   JSON

        ```
1{2  "event": "charge.success",3  "data": {4    "id": 59565,5    "domain": "test",6    "status": "success",7    "reference": "48rx32f1womvcr4",8    "amount": 186677,9    "message": "madePayment",10    "gateway_response": "Payment successful",11    "paid_at": "2024-08-20T12:41:12.000Z",12    "created_at": "2024-08-20T12:39:22.000Z",13    "channel": "qr",14    "currency": "ZAR",15    "ip_address": "18.130.45.28, 141.101.107.157",16    "fees_breakdown": {17      "amount": "5514",18      "formula": null,19      "type": "paystack"20    },21    "metadata": "",22    "log": null,23    "fees": 6342,24    "fees_split": null,25    "authorization": {26      "authorization_code": "AUTH_2b4zs69fgy7qflh",27      "bin": "483953",28      "last4": "6208",29      "exp_month": "12",30      "exp_year": "2025",31      "channel": "qr",32      "card_type": "CREDIT",33      "bank": "ABSA BANK LIMITED, SOUTH AFRICA",34      "country_code": "ZA",35      "brand": "VISA",36      "reusable": false,37      "signature": null,38      "account_name": null,39      "receiver_bank_account_number": null,40      "receiver_bank": null41    },42    "customer": {43      "id": 16787,44      "first_name": "Ian",45      "last_name": "SURRENDER",46      "email": "customer@email.com",47      "customer_code": "CUS_ehg851zbxon0bvx",48      "phone": "",49      "metadata": null,50      "risk_action": "default"51    },52    "plan": {},53    "subaccount": {},54    "subaccount_group": {},55    "paidAt": "2024-08-20T12:41:12.000Z"56  }57}
```

##### QR code recurring charge

Charging returning customers isn't supported currently. You need to call the endpoint to start a new transaction.

### Supported apps

To complete a payment, your customers can scan or enter the code in the supported apps listed below:

    #### SnapScan

Customers can complete a payment in a snap by scanning the QR code with their SnapScan iOS or Android app.

#### Scan to pay

Customers can use Scan to Pay QR codes from any of the mobile apps listed below:

    | Banking Apps | Wallets | Standalone Scan to Pay |
| --- | --- | --- |
| Standard Bank | Ukheshe | Nedbank Scan to Pay |
| FNB Banking | Spot (by Virgin Money) | Standard Bank Scan to Pay |
| Nedbank Money | Vodapay | Absa Scan to Pay |
| Capitec Bank | Telkom Pay |  |
| Absa | Instapay |  |
| RMB | Nedbank Avo |  |

## Capitec Pay

##### Feature Availability

Capitec Pay is available to businesses in South Africa only.

    Capitec Pay is an open banking payment method that allows customers to pay securely using either their mobile phone number, ID, or account number. When a Capitec Pay transaction is initiated, the customer receives a push notification in their Capitec banking app to authorize the payment, eliminating the need to share sensitive card details or internet banking login credentials.

### Create a charge

Send an email and amount to the [chargeAPI](https://paystack.com/docs/api/charge) endpoint along with a `qr` object. The `qr` object should have the `provider` parameter set to `scan-to-pay`.

cURLNodePHP

Show Response

    ```
1curl https://api.paystack.co/charge2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "amount": 1000,5      "email": "drew.john@email.com",6      "currency": "ZAR",7      "capitec_pay": {8        "identifier_key" : "CELLPHONE",9        "identifier_value" : "0812345678"10      }11    }'12-X POST
```

    ```
1{2  "type": "success",3  "code": "ok",4  "data": {5    "status": "success",6    "timeToLive": 120,7    "expiryDate": "2026-02-17T11:29:37.000Z",8    "transaction": {9      "id": 5805764100,10      "reference": "nvh8o4pwtivwkx4",11      "domain": "live",12      "amount": 1000,13      "currency": "ZAR",14      "metadata": "",15      "createdAt": "2026-02-17T11:27:36.000Z",16      "customer": {17        "id": 180101459,18        "first_name": "Drew",19        "last_name": "John",20        "email": "drew.john@email.com",21        "customer_code": "CUS_xy1ofyzvnhagniv",22        "phone": "",23        "metadata": null,24        "risk_action": "default",25        "international_format_phone": null26      }27    }28  },29  "message": "Charge pending"30}
```

##### Transaction Verification

You need to store the transaction reference to check the status of the charge via the [Requery TransactionAPI](https://paystack.com/docs/api/capitec-pay#requery) endpoint.

### Handling errors

The table below shows common errors and how to resolve them:

    | Message | Error code | Reason |
| --- | --- | --- |
| Account is de-activated, please contact Capitec for help. | `not_found` | The customer deactivated their account. |
| Customer details not found, please try again or contact Capitec. | `not_found` | The customer does not exist on Capitec. |
| Capitec app not detected, please check it’s installed and up to date. | `not_found` | The customer does not have the Capitec app installed. |
| You’ve blocked this business, please contact Capitec for help. | `charge_restricted` | The customer blocked the merchant. |
| Charge Failed | `amount_exceed_limit` | This is a duplicate charge for the same amount in a short time period. |

###### On this Page

-   [Cards](https://paystack.com/docs/payments/payment-channels/#cards)
-   [Bank accounts](https://paystack.com/docs/payments/payment-channels/#bank-accounts)
-   [Pay with Transfer](https://paystack.com/docs/payments/payment-channels/#pay-with-transfer)
-   [USSD](https://paystack.com/docs/payments/payment-channels/#ussd)
-   [Mobile money](https://paystack.com/docs/payments/payment-channels/#mobile-money)
-   [EFT](https://paystack.com/docs/payments/payment-channels/#eft)
-   [Pay with Pesalink](https://paystack.com/docs/payments/payment-channels/#pay-with-pesalink)
-   [QR code](https://paystack.com/docs/payments/payment-channels/#qr-code)
-   [Capitec Pay](https://paystack.com/docs/payments/payment-channels/#capitec-pay)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

                                                                Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

                                                                                                                                 If you have any questions or need general help, visit our support page](https://support.paystack.com)