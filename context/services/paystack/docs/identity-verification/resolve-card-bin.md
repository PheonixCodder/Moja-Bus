# Resolve Card BIN

This endpoint takes the first 6 digits of a card PAN and returns the following details about the card:

-   Card Type
-   Bin
-   Brand
-   Sub-brand
-   Bank
-   Country code
-   Country name

cURLNodePHP

Show Response

```
1curl https://api.paystack.co/decision/bin/5399832-H "Authorization: Bearer YOUR_SECRET_KEY"3-X GET
```

```
1{2  "status": true,3  "message": "Bin resolved",4  "data": {5    "bin": "539983",6    "brand": "Mastercard",7    "sub_brand": "",8    "country_code": "NG",9    "country_name": "Nigeria",10    "card_type": "DEBIT",11    "bank": "Guaranty Trust Bank",12    "linked_bank_id": 913  }14}
```

You can use this endpoint to determine the country of issue of a card.

##### Pricing

This endpoint is free.

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)