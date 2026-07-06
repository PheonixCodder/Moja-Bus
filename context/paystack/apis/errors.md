# Errors
When a request to the Paystack API fails, the response always includes clear information about what went wrong and how to fix it. Each error follows a consistent structure that contains a human-readable message, a machine-readable code, and optional diagnostic information to help you debug quickly.

Paystack's API is RESTful and as such, uses conventional HTTP response codes to indicate the success or failure of requests.

<table class="params-holder"><caption class="params-group">HTTP Codes</caption><tbody><tr><td class="param-details"><p>200</p></td><td>Request was successful and intended action was carried out. Note that we will always send a 200 if a charge or verify request was made. Do check the data object to know how the charge went (i.e. successful or failed).</td></tr><tr><td class="param-details"><p>201</p></td><td>A resource has successfully been created.</td></tr><tr><td class="param-details"><p>400</p></td><td>A validation or client side error occurred and the request wasn't fulfilled.</td></tr><tr><td class="param-details"><p>401</p></td><td>The request wasn't authorized. This can be triggered by passing an invalid secret key in the authorization header or the lack of one.</td></tr><tr><td class="param-details"><p>404</p></td><td>Request couldn't be fulfilled as the request resource doesn't exist.</td></tr><tr><td class="param-details"><p>5xx</p></td><td>Request couldn't be fulfilled due to an error on Paystack's end. This shouldn't happen so please report as soon as you encounter any instance of this.</td></tr></tbody></table>

## Error response format

Every error response includes the same top-level fields:

<table class="params-holder"><caption class="params-group">Keys</caption><tbody><tr><td class="param-details"><p>status</p><p>Boolean</p></td><td>This lets you know if the request to the API was received and processed successfully or not. We recommend that you use this in combination with HTTP status codes to determine the result of an API call.</td></tr><tr><td class="param-details"><p>message</p><p>String</p></td><td>This is a brief description of the error that occurred.</td></tr><tr><td class="param-details"><p>meta</p><p>Object</p></td><td>An object containing additional information about the error. It contains a <code>next_step</code> key that provides a suggested action to resolve the issue. It may also contain other diagnostic information to help you debug the issue.</td></tr><tr><td class="param-details"><p>type</p><p>String</p></td><td>The type of error that occurred. This can be one of the following: <code>api_error</code>, <code>validation_error</code>, or <code>processor_error</code>.</td></tr><tr><td class="param-details"><p>code</p><p>String</p></td><td>A Paystack-defined error code that categorizes the error. This helps you quickly identify the type of error that occurred.</td></tr><tr><td class="param-details"><p>data</p><p>Object</p></td><td>This is generally not returned for error responses, but may be returned in some cases where the error is related to the data being processed.</td></tr></tbody></table>

The `meta` object contains additional information about that can be helpful in resolving the error. It generally contains a `next_step` key that provides a suggested action to resolve the issue, and may provide other diagnostic information to help you debug the issue.

For example, when a bulk transfer is rejected, the `meta` object indicates if any of the transfer recipients are invalid or blacklisted.

-   Sample Validation Error

```
1{2  "status": false,3  "message": "Email Address is required",4  "meta": {5    "nextStep": "Provide all required params "6  },7  "type": "validation_error",8  "code": "missing_params"9}
```

##### Not sure where to look? Try search

Type the error or keywords into the search bar at the top of the page. If you don’t find what you’re looking for, [contact us](mailto:techsupport@paystack.com), we’re happy to help.

## Error categories

Errors are grouped into categories to make them easier to understand and handle programmatically.

<table class="params-holder"><caption class="params-group">Error Categories</caption><tbody><tr><td class="param-details"><p>api_error</p><p>String</p></td><td>This indicates that the error happened on the Paystack API. Errors here include attempts to access resources that an integration isn't authorized to access, or similar API-level issues.</td></tr><tr><td class="param-details"><p>validation_error</p><p>String</p></td><td>This indicates that the error is related to invalid data in the request. Errors here include missing or invalid parameters being passed to the API.</td></tr><tr><td class="param-details"><p>processor_error</p><p>String</p></td><td>This indicates that the error is related to the payment processor or gateway. Errors here include insufficient funds, blocked/expired cards, or other issues relayed by the payment processor.</td></tr></tbody></table>