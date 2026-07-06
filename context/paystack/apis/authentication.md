# Authentication
All requests to the Paystack API must be authenticated. Authentication identifies which Paystack integration a request belongs to and determines whether it’s authorized to perform the requested action.

The Paystack API uses **API keys** to authenticate requests. Every request must include your **secret key** in the `Authorization` header, using the **Bearer** scheme.

## API keys

Every Paystack integration provides two types of API keys for each environment:

| Type | Prefix | Description |
| --- | --- | --- |
| Public Key | pk\_ | Used on the frontend when integrating using Paystack Inline and in our Mobile SDKs only. By design, public keys can only initiate transactions to your account. |
| Secret Key | sk\_ | Used on the backend when making API requests. The secret keys must be stored securely. |

You can find your API keys on the [API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developers) section of the **Paystack Dashboard** or in the [Developers overview](https://dashboard.paystack.com/v2/developers) page of **Paystack Canvas**.

It's good practice to rotate your API keys periodically to enhance security. You can rotate your keys by generating new ones in the [API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developers) section of the **Paystack Dashboard** or in the [Developers overview](https://dashboard.paystack.com/v2/developers) page of **Paystack Canvas**. If you suspect that your secret key has been compromised, you should rotate it immediately.

Don't commit your secret keys to git, or use them in client-side code.

Authorization headers should be in the following format: `Authorization: Bearer SECRET_KEY`

Authorization: Bearer sk\_test\_r3m3mb3r2pu70nasm1l3

API requests made without authentication fail with the status code `401: Unauthorized`. All API requests must be made over HTTPS.

Don't set `VERIFY_PEER` to `FALSE`. Ensure your server verifies the SSL connection to Paystack.

## Test and live modes

Paystack provides two separate environments for integration:

1.  **Test mode**: For development and quality assurance. Transactions and API calls here don't involve real money.
2.  **Live mode**: For production. Transactions and settlements are real and processed through your live Paystack account.

Each environment has its own set of public and secret keys. Test keys are prefixed with `pk_test_` and `sk_test_`, while live keys are prefixed with `pk_live_` and `sk_live_`.

The test environment aims to closely mirror live behavior, but not all features are available. For example, settlements aren't processed in test mode, and some payment channels are unavailable.

## IP whitelisting

IP whitelisting is a security feature that allows only specific IP addresses to make API requests using your secret keys. This provides an added layer of security by preventing unauthorized usage of your secret keys from unknown IP addresses.

When IP whitelisting is enabled, Paystack checks the IP address that each secret key request originates from and compares it with your list of whitelisted IP addresses. If the request's IP address is whitelisted, Paystack allows the request. If not, Paystack blocks the request.

You can whitelist up to **10 IP addresses** for each environment from your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers) or on [Paystack Canvas](https://dashboard.paystack.com/v2/developers). Only admin users or users with permission to manage API Keys and Webhooks can whitelist IPs on your Paystack account. We will send an email to the main owner of the integration when a user updates the whitelisted IPs for your live secret keys.

Only valid **public IPv4 addresses** are accepted. IPv6 addresses, IP ranges, and private IP addresses aren't supported.

## Key management best practices

1.  Never embed your secret key in frontend code, mobile apps, or public repositories.
2.  Store keys securely using environment variables or a secrets manager.
3.  Rotate keys periodically, especially if you suspect exposure.
4.  Restrict who can view or manage API keys in your Dashboard.