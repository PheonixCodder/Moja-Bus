## Settlements

The Settlements API allows you gain insights into payouts made by Paystack to your bank account.

## List Settlements

List settlements made to your settlement accounts

### Headers

Set value to `Bearer SECRET_KEY`

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

Fetch settlements based on their state. Value can be one of `success`, `processing`, `pending` or `failed`.

Provide a subaccount ID to export only settlements for that subaccount. Set to `none` to export only transactions for the account.

A timestamp from which to start listing settlements e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing settlements e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/settlement"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Settlements retrieved",4  "data": [5    {6      "id": 3090024,7      "domain": "live",8      "status": "success",9      "currency": "NGN",10      "integration": 463433,11      "total_amount": 995,12      "effective_amount": 995,13      "total_fees": 5,14      "total_processed": 1000,15      "deductions": null,16      "settlement_date": "2022-11-09T00:00:00.000Z",17      "settled_by": null,18      "createdAt": "2022-11-09T01:04:08.000Z",19      "updatedAt": "2022-11-09T08:12:01.000Z"20    },21    {22      "id": 2856168,23      "domain": "live",24      "status": "success",25      "currency": "NGN",26      "integration": 463433,27      "total_amount": 9610,28      "effective_amount": 9610,29      "total_fees": 390,30      "total_processed": 10000,31      "deductions": null,32      "settlement_date": "2022-09-02T00:00:00.000Z",33      "settled_by": null,34      "createdAt": "2022-09-02T01:14:11.000Z",35      "updatedAt": "2022-09-02T04:32:01.000Z"36    },37    {38      "id": 2276794,39      "domain": "live",40      "status": "success",41      "currency": "NGN",42      "integration": 463433,43      "total_amount": 4975,44      "effective_amount": 4975,45      "total_fees": 25,46      "total_processed": 5000,47      "deductions": null,48      "settlement_date": "2022-02-26T00:00:00.000Z",49      "settled_by": null,50      "createdAt": "2022-02-26T01:24:27.000Z",51      "updatedAt": "2022-02-28T09:32:00.000Z"52    },53    {54      "id": 2255771,55      "domain": "live",56      "status": "success",57      "currency": "NGN",58      "integration": 463433,59      "total_amount": 38356,60      "effective_amount": 38356,61      "total_fees": 194,62      "total_processed": 38550,63      "deductions": null,64      "settlement_date": "2022-02-19T00:00:00.000Z",65      "settled_by": null,66      "createdAt": "2022-02-19T01:23:31.000Z",67      "updatedAt": "2022-02-21T09:32:00.000Z"68    },69    {70      "id": 2246373,71      "domain": "live",72      "status": "success",73      "currency": "NGN",74      "integration": 463433,75      "total_amount": 24875,76      "effective_amount": 24875,77      "total_fees": 125,78      "total_processed": 25000,79      "deductions": null,80      "settlement_date": "2022-02-16T00:00:00.000Z",81      "settled_by": null,82      "createdAt": "2022-02-16T01:24:09.000Z",83      "updatedAt": "2022-02-16T09:12:00.000Z"84    },85    {86      "id": 2234251,87      "domain": "live",88      "status": "success",89      "currency": "NGN",90      "integration": 463433,91      "total_amount": 0,92      "effective_amount": 0,93      "total_fees": 1,94      "total_processed": 1,95      "deductions": null,96      "settlement_date": "2022-02-12T00:00:00.000Z",97      "settled_by": null,98      "createdAt": "2022-02-12T01:20:50.000Z",99      "updatedAt": "2022-02-14T06:07:07.000Z"100    },101    {102      "id": 2046406,103      "domain": "live",104      "status": "success",105      "currency": "NGN",106      "integration": 463433,107      "total_amount": 15439,108      "effective_amount": 15439,109      "total_fees": 78,110      "total_processed": 15517,111      "deductions": null,112      "settlement_date": "2021-12-07T00:00:00.000Z",113      "settled_by": null,114      "createdAt": "2021-12-07T01:25:18.000Z",115      "updatedAt": "2021-12-07T09:42:03.000Z"116    },117    {118      "id": 1986550,119      "domain": "live",120      "status": "pending",121      "currency": "NGN",122      "integration": 463433,123      "total_amount": 4975,124      "effective_amount": 4975,125      "total_fees": 25,126      "total_processed": 5000,127      "deductions": null,128      "settlement_date": "2021-11-16T00:00:00.000Z",129      "settled_by": null,130      "createdAt": "2021-11-16T01:17:49.000Z",131      "updatedAt": "2021-11-16T01:17:49.000Z"132    },133    {134      "id": 1955844,135      "domain": "live",136      "status": "success",137      "currency": "NGN",138      "integration": 463433,139      "total_amount": 29550,140      "effective_amount": 29550,141      "total_fees": 450,142      "total_processed": 30000,143      "deductions": null,144      "settlement_date": "2021-11-05T00:00:00.000Z",145      "settled_by": null,146      "createdAt": "2021-11-05T01:14:28.000Z",147      "updatedAt": "2021-11-09T08:42:09.000Z"148    },149    {150      "id": 1913601,151      "domain": "live",152      "status": "pending",153      "currency": "NGN",154      "integration": 463433,155      "total_amount": 9850,156      "effective_amount": 9850,157      "total_fees": 150,158      "total_processed": 10000,159      "deductions": null,160      "settlement_date": "2021-10-21T00:00:00.000Z",161      "settled_by": null,162      "createdAt": "2021-10-21T01:05:22.000Z",163      "updatedAt": "2021-10-21T01:05:22.000Z"164    },165    {166      "id": 1897850,167      "domain": "live",168      "status": "success",169      "currency": "NGN",170      "integration": 463433,171      "total_amount": 6965,172      "effective_amount": 6965,173      "total_fees": 35,174      "total_processed": 7000,175      "deductions": null,176      "settlement_date": "2021-10-15T00:00:00.000Z",177      "settled_by": null,178      "createdAt": "2021-10-15T01:03:17.000Z",179      "updatedAt": "2021-10-15T15:07:39.000Z"180    },181    {182      "id": 1875499,183      "domain": "live",184      "status": "success",185      "currency": "NGN",186      "integration": 463433,187      "total_amount": 33635,188      "effective_amount": 33635,189      "total_fees": 1365,190      "total_processed": 35000,191      "deductions": null,192      "settlement_date": "2021-10-06T00:00:00.000Z",193      "settled_by": null,194      "createdAt": "2021-10-06T01:21:08.000Z",195      "updatedAt": "2021-10-06T10:35:10.000Z"196    },197    {198      "id": 1856831,199      "domain": "live",200      "status": "success",201      "currency": "NGN",202      "integration": 463433,203      "total_amount": 9610,204      "effective_amount": 9610,205      "total_fees": 390,206      "total_processed": 10000,207      "deductions": null,208      "settlement_date": "2021-09-29T00:00:00.000Z",209      "settled_by": null,210      "createdAt": "2021-09-29T01:17:33.000Z",211      "updatedAt": "2021-10-15T15:07:38.000Z"212    },213    {214      "id": 1319048,215      "domain": "live",216      "status": "success",217      "currency": "NGN",218      "integration": 463433,219      "total_amount": 4925,220      "effective_amount": 4925,221      "total_fees": 75,222      "total_processed": 5000,223      "deductions": null,224      "settlement_date": "2021-02-10T00:00:00.000Z",225      "settled_by": null,226      "createdAt": "2021-02-10T01:03:25.000Z",227      "updatedAt": "2021-06-22T17:00:36.000Z"228    },229    {230      "id": 1060807,231      "domain": "live",232      "status": "success",233      "currency": "NGN",234      "integration": 463433,235      "total_amount": 19700,236      "effective_amount": 19700,237      "total_fees": 300,238      "total_processed": 20000,239      "deductions": null,240      "settlement_date": "2020-09-30T00:00:00.000Z",241      "settled_by": null,242      "createdAt": "2020-09-30T01:12:49.000Z",243      "updatedAt": "2020-09-30T09:23:02.000Z"244    }245  ],246  "meta": {247    "total": 15,248    "skipped": 0,249    "perPage": 50,250    "page": 1,251    "pageCount": 1252  }253}
```

## List Settlement Transactions

Get the transactions that make up a particular settlement

If you plan to store or make use of the the transaction ID, you should represent it as a unsigned 64-bit integer. To learn more, [check out our changelog](https://paystack.com/docs/changelog/api/#june-2022).

### Headers

Set value to `Bearer SECRET_KEY`

### Path Parameters

The settlement ID in which you want to fetch its transactions

### Query Parameters

Specify how many records you want to retrieve per page. If not specified, we use a default value of 50.

Specify exactly what page you want to retrieve. If not specified, we use a default value of 1.

A timestamp from which to start listing settlement transactions e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

A timestamp at which to stop listing settlement transactions e.g. `2016-09-24T00:00:05.000Z`, `2016-09-21`

```
1#!/bin/sh2url="https://api.paystack.co/settlement/:id/transactions"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

```
1{2  "status": true,3  "message": "Transactions retrieved",4  "data": [5    {6      "id": 2067030515,7      "domain": "live",8      "status": "success",9      "reference": "da8ed5u8sz6yn95",10      "amount": 10000,11      "message": "",12      "gateway_response": "Approved",13      "paid_at": "2022-09-01T10:36:37.000Z",14      "created_at": "2022-09-01T10:26:02.000Z",15      "channel": "card",16      "currency": "NGN",17      "ip_address": "172.31.63.124",18      "metadata": {19        "custom_fields": [20          {21            "value": "makurdi",22            "display_name": "Donation for",23            "variable_name": "donation_for"24          }25        ]26      },27      "log": null,28      "fees": 390,29      "fees_split": null,30      "customer": {31        "id": 44100000,32        "first_name": null,33        "last_name": null,34        "email": "some@body.com",35        "phone": null,36        "metadata": null,37        "customer_code": "CUS_38uvy1ksasyupp",38        "risk_action": "default"39      },40      "authorization": {41        "authorization_code": "AUTH_whyjj12345",42        "bin": "460000",43        "last4": "1234",44        "exp_month": "11",45        "exp_year": "2022",46        "channel": "card",47        "card_type": "visa debit",48        "bank": "",49        "country_code": "KE",50        "brand": "visa",51        "reusable": true,52        "signature": "SIG_0Rof76ERZlJMnXm9090",53        "account_name": null54      },55      "plan": {},56      "split": {},57      "subaccount": {},58      "order_id": null,59      "paidAt": "2022-09-01T10:36:37.000Z",60      "createdAt": "2022-09-01T10:26:02.000Z",61      "requested_amount": 10000,62      "source": {63        "source": "merchant_api",64        "type": "api",65        "identifier": null,66        "entry_point": "transaction_initialize"67      },68      "pos_transaction_data": null69    }70  ],71  "meta": {72    "total": 1,73    "total_volume": 100,74    "skipped": 0,75    "perPage": 50,76    "page": 1,77    "pageCount": 178  }79}
```