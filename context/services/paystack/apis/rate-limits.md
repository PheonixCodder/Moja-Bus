# Rate limits

Rate limiting is one of the mechanisms we use in our infrastructure to ensure the stability of our API. It provides guardrails to avoid an outburst of API requests. This means there is a limited number of requests you can make per time window for each endpoint. Going beyond this limit returns a `429` error, indicating that you need to reduce your request rate.

When you receive a `429`, parse the response headers to know how to proceed:

### Headers

A time in seconds indicating when the current limit window ends. It tells you when you can retry the request.

The number of requests remaining in the current rate limit window.

The maximum number of requests permitted per rate limit window.

-   Rate Limit

```
1{2  "status": false,3  "message": "Rate limit exceeded!",4  "meta": {5    "nextStep": "Wait a few minutes and try the API call again"6  },7  "type": "api_error",8  "code": "rate_limited"9}
```

## Standard limits

Most endpoints share a default limit. Limits apply per integration with separate quota for live and test mode.

| Mode | Limits |
| --- | --- |
| Live | 600 requests per 60 seconds |
| Test | 100 requests per 60 seconds |

Test mode is for development and integration testing, not load testing.

## Extended limits

Certain foundational endpoints have higher dedicated limits in order to ensure critical business operations run smoothly. They include:

| Endpoint | Limits |
| --- | --- |
| [Verify Transaction](https://paystack.com/docs/api/transaction#verify) | 3,000 requests per 60 seconds |
| [Resolve Account Number](https://paystack.com/docs/api/verification#resolve-account) | 1,500 requests per 60 seconds |
| [Initialize Transaction](https://paystack.com/docs/api/transaction#initialize) | 1,200 requests per 60 seconds |
| [Charge Authorization](https://paystack.com/docs/api/transaction#charge-authorization) | 1,200 requests per 60 seconds |
| [Create Charge](https://paystack.com/docs/api/charge#create) | 1,200 requests per 60 seconds |
| [Check Pending Charge](https://paystack.com/docs/api/charge#check) | 1,200 requests per 60 seconds |
| [Initiate Transfer](https://paystack.com/docs/api/transfer#initiate) | 900 requests per 60 seconds |

Extended limits only apply to live mode. Test mode make use of the standard limit for all endpoints.

## Handling a 429

When an endpoint returns a `429`, your integration should:

1.  Read the `x-ratelimit-reset` value (in seconds) from the response headers.
2.  Pause requests to that endpoint until the window ends.
3.  If you see sustained `429`s across multiple endpoints, pause and investigate. An unchecked loop is usually the cause.

Limit apply per endpoint not across your integration. When an endpoint is rate limited, other endpoints will keep returning responses until you hit their limit.

-   Rate Limit

```
1{2  "status": false,3  "message": "Rate limit exceeded!",4  "meta": {5    "nextStep": "Wait a few minutes and try the API call again"6  },7  "type": "api_error",8  "code": "rate_limited"9}
```

## Staying within limit

In practice, most rate-limit issues come from a few avoidable patterns. To stay well within the limits:

1.  **Listen for webhooks instead of polling.** The most common source of `429` responses is polling immediately an asychronous request is made. For example, calling `/transaction/verify/:reference` in a loop while awaiting the final transaction status. We send webhook events for asychronous requests. If you must verify on demand, make calls once per moment.
2.  **Cache stable lookups.** `/bank/resolve` always returns the same name for the same account number and bank code except the customer has made a change to their details from their bank. Caching such details also improves your apps performance.
3.  **Batch when reconciling.** Use the `/transaction` list endpoint with a date range during reconciliation instead of calling verify once per reference. By default, a list request returns 50 items.
4.  **Use bulk endpoints for high volume.** If you're initiating many transfers or charges, use [Bulk Transfer](https://paystack.com/docs/api/transfer#bulk) and [Initiate Bulk Charge](https://paystack.com/docs/api/bulk-charge#initiate) instead of calling the single-item endpoints in a loop. Each bulk request counts once toward your rate limit while processing many items in a batch.

## Custom limits

Certain businesses have high throughput with unpredicable patterns. If you require higher limits, reach out to [support@paystack.com](mailto:support@paystack.com) with the endpoint, your expected sustained and peak request rates, and a brief description of what your integration does. We'll work with you to provision the right limit.