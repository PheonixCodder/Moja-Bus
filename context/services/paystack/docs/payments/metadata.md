# Metadata

Add custom data to your request payload

## Crafting metadata

With metadata, you can add additional parameters that an endpoint doesn't accept naturally. Crafting metadata will depend on your language's handling of JSON. Common metadata are:

-   Invoice ID
-   Cart ID
-   Cart Items
-   Payment medium (site/app)

There are two ways to add parameters to the metadata object:

1.  **Key/value pair**: You pass the parameter as a key and value pair like this: `cart_id: IU929`. Parameters passed this way don't show up on the dashboard, however, they're returned with the API response.
2.  **Custom Fields**: The `custom_fields` key is reserved for an array of custom fields that should show on the dashboard when you click the transaction.

Custom fields have 3 keys: `display_name`, `variable_name`, and `value`. The display name will be the label for the value when displaying.

-   JSON

```
1{2  "metadata": {3    "cart_id": 398,4    "custom_fields": [5      {6        "display_name": "Invoice ID",7        "variable_name": "Invoice ID",8        "value": 2099      },10      {11        "display_name": "Cart Items",12        "variable_name": "cart_items",13        "value": "3 bananas, 12 mangoes"14      }15    ]16  }17}
```

## Cancel action

You can redirect your users to a chosen URL when they cancel a payment. This is done by setting a `cancel_action` in your metadata:

```json
1"metadata": {2  "cancel_action": "https://your-cancel-url.com"3}
```

## Custom filters

Custom filters allow you control how a transaction is completed by using the `custom_filters` object in the `metadata` object.

### Recurring payment

If you need to debit your customer in future, specify `recurring=true` in the `custom_filters` object.

```json
1"metadata": {2  "custom_filters": {3    "recurring": true4  }5}
```

This is supported for the Card and Pay with Bank (PwB) channels with a different behaviour for each channel.

#### Card

With the `card` channel, we accept only Verve cards that support recurring billing and force a bank authentication for MasterCard and VISA.

#### Pay with bank

With the `pwb` channel, we'll only make the supported banks available for customers to make payment. Banks that don't support recurring payments are filtered out.

### Selected bank cards

You can use the `banks` parameter to specify a the bank codes when you only want particular bank cards to be accepted for a transaction. You can use the [List BanksAPI](https://paystack.com/docs/api/miscellaneous#bank) to get the list of supported bank codes.

```json
1"metadata": {2  "custom_filters": {3    "banks": ["057", "100"]4  }5}
```

### Selected card brands

If you only want certain card brands to be accepted for a transaction, specify the brands in the `card_brands` array:

```json
1"metadata": {2  "custom_filters": {3    "card_brands": ["visa"]4  }5}
```

We currently support the following card brands:

| Brand | Code | Country |
| --- | --- | --- |
| Verve | `verve` | Nigeria |
| Visa | `visa` | All regions |
| American Express | `amex` | Nigeria, Kenya, South Africa |
| Mastercard | `mastercard` | All regions |

The filters can also be combined for a comprehensive rule. In the snippet below, the filters tell us that the customer should be enrolled on recurring billing and we should only accept a visa card from **Zenith (057)** or **Suntrust bank (100)**.

-   JSON

```
1{2  "metadata": {3    "custom_filters": {4      "recurring": true,5      "banks": [6        "057",7        "100"8      ],9      "card_brands": [10        "visa"11      ]12    }13  }14}
```

### Selected bank accounts

The `supported_bank_providers` parameter allows you to specify the banks you want on the [Pay with Bank](https://paystack.com/docs/payments/payment-channels/#bank-accounts) channel. When set, the customer will only see the banks you specified. You should use the [List BanksAPI](https://paystack.com/docs/api/miscellaneous#bank) endpoint to get the bank codes.

```json
1"metadata": {2  "custom_filters": {3    "supported_bank_providers": [4      "033",5      "215",6      "102"7    ]8  }9}
```

### Selected MoMo provider

Sometimes, you want to give preference to only certain mobile money providers. For example, you might want to run a campaign to allow just a certain provider. To do this, you can specify the providers in the `supported_mobile_money_providers` parameter:

```json
1"metadata": {2  "custom_filters": {3    "supported_mobile_money_providers": ["vod"]4  }5}
```

| Provider | Code | Country |
| --- | --- | --- |
| MTN | `mtn` | Ghana |
| AirtelTigo | `atl` | Ghana |
| Vodafone | `vod` | Ghana |

###### On this Page

-   [Crafting metadata](https://paystack.com/docs/payments/metadata/#crafting-metadata)
-   [Cancel action](https://paystack.com/docs/payments/metadata/#cancel-action)
-   [Custom filters](https://paystack.com/docs/payments/metadata/#custom-filters)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)