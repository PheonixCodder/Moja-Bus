## Introduction

Learn how to integrate Paystack's APIs into your apps.

## API basics

The Paystack API lets you programmatically collect payments, manage transactions, and perform other operations that you can also do from your Paystack Dashboard. It's a RESTful, JSON-based API that uses standard HTTP methods and requires authentication for most requests.

All requests must be made over HTTPS. Unencrypted HTTP requests aren't supported.

### Base URL

The base URL for all API requests is:

```
https://api.paystack.co
```

This works for both test and live environments. Your API keys determine which environment you're using.

### Environments and API keys

Paystack provides both test and live environments, each with their own set of API keys. Use your test keys for development and testing, and your live keys for production.

For more details on obtaining and managing your API keys, see the [Authentication](https://paystack.com/docs/api/authentication) section.

### HTTP methods

The Paystack API follows standard HTTP semantics.

| Method | Type | Description |
| --- | --- | --- |
| POST | String | Creates a new resource on the server. |
| GET | String | Retrieves a representation of a resource. |
| PUT | String | Updates an existing resource or creates it if it doesn't exist. |
| DELETE | String | Deletes a specified resource. |

## Making requests

All requests to the Paystack API are made to the base URL and must include your secret key in the Authorization header.

Authorization headers should be in the following format: `Authorization: Bearer YOUR_SECRET_KEY`.

The API Reference lists examples of requests for each endpoint. You can copy and paste these examples into your own code or run them from the command line using cURL. You can also explore the API [using Postman](https://www.postman.com/downloads/) and the [Paystack Postman Collection](https://www.postman.com/paystack-developers/workspace/paystack-api/overview).

## Requests and responses

Both request body data and response data are formatted as JSON. Content type for responses is always `application/json`. Generally, all responses are in the following format:

<table class="params-holder"><caption class="params-group">Keys</caption><tbody><tr><td class="param-details"><p>status</p><p>Boolean</p></td><td>This lets you know if your request was succesful or not. We recommend that you use this in combination with HTTP status codes to determine the result of an API call.</td></tr><tr><td class="param-details"><p>message</p><p>String</p></td><td>This is a summary of the response and its status. For instance when trying to retrieve a list of customers, message might read “Customers retrieved”. In the event of an error, the message key will contain a description of the error as with the authorization header situation above. This is the only key that's universal across requests.</td></tr><tr><td class="param-details"><p>data</p><p>Object</p></td><td>This contain the results of your request. It can either be an object, or an array depending on the request made. For instance, a request to retrieve a single customer will return a customer object in the data key, while the key would be an array of customers if a list is requested instead.</td></tr></tbody></table>

-   Response Format

```
1{2  "status": "[boolean]",3  "message": "[string]",4  "data": "[object]"5}
```

### Meta object

Many Paystack API responses include a meta object that contains additional, endpoint-specific information. The contents of this object vary depending on:

-   whether the request succeeded or failed, and
-   which endpoint returned the response.

For successful requests, the meta object contains supplementary information about the returned data. This is most common on list endpoints, where Paystack returns additional fields to help you navigate large datasets.

The fields returned in the meta object for list endpoints vary depending on the pagination method used. For full details on each field and when to use cursor vs offset pagination, see the [Pagination](https://paystack.com/docs/api/pagination) section.

When a request fails, the meta object contains diagnostic information that can help you debug the issue. For more details on error responses and how to use the meta object to debug errors, see the [Errors](https://paystack.com/docs/api/errors) section.

-   Meta Key Structure

```
1{2  "meta": {3    "total": 2,4    "skipped": 0,5    "perPage": 50,6    "page": 1,7    "pageCount": 18  }9}
```

## Supported currency

Paystack makes use of the [ISO 4217](https://www.iso.org/iso-4217-currency-codes.html) format for currency codes. When sending an amount, it must be sent in the subunit of that currency.

Sending an amount in subunits simply means multiplying the base amount by **100**. For example, if a customer is supposed to make a payment of **NGN 100**, you would send **10000 = 100 \* 100** in your request.

In some markets, multiple currencies are supported each with their own transaction fees and minimum amounts. You can learn more about the supported currencies below and in the [Enabling International Payments](https://support.paystack.com/en/articles/2130690) article.

While there is no subunit for **XOF**, developers **must** multiply the amount by **100** regardless. This doesn't imply that the amount can have a fractional part. If we notice a fractional part during processing, we ignore the fractional part.

| Currency code | Subunit | Description | Transaction minimum | Availability |
| --- | --- | --- | --- | --- |
| NGN | Kobo | Nigerian Naira | ₦ 50.00 | Nigeria |
| USD | Cent | US Dollar | $ 2.00 | Kenya and Nigeria |
| GHS | Pesewa | Ghanaian Cedi | ₵ 0.10 | Ghana |
| ZAR | Cent | South African Rand | R 1.00 | South Africa |
| KES | Cent | Kenyan Shilling | Ksh. 3.00 | Kenya |
| XOF | \- | West African CFA Franc | XOF 1.00 | Côte d'Ivoire |

```
1{2  "amount": 5000,3  "currency": "NGN"4}
```