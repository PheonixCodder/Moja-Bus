# Accept Payments

To accept a payment, create a transaction using our API, our client Javascript library, Popup JS, or our SDKs. Every transaction includes a link that can be used to complete payment.

Paystack Popup is a Javascript library that allow developers to build a secure and convenient payment flow for their web applications. You can add it to your frontend app via `CDN`, `NPM` or `Yarn`:

-   CDN
-   NPM
-   Yarn

```
1<script src="https://js.paystack.co/v2/inline.js">
```

If you used `NPM` or `Yarn`, ensure you import the library as shown below:

```javascript
1import PaystackPop from '@paystack/inline-js'
```

With the library successfully installed, you can now begin the three-step integration process:

1.  Initialize transaction
2.  Complete transaction
3.  Verify transaction status

### Initialize transaction

To get started, you need to initialize the transaction from your backend. Initializing the transaction from the backend ensures you have full control of the transaction details. To do this, make a `POST` request from your backend to the [Initialize TransactionAPI](https://paystack.com/docs/api/transaction#initialize) endpoint:

```
1curl https://api.paystack.co/transaction/initialize2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "500000"6    }'7-X POST
```

```
1{2  "status": true,3  "message": "Authorization URL created",4  "data": {5    "authorization_url": "https://checkout.paystack.com/nkdks46nymizns7",6    "access_code": "nkdks46nymizns7",7    "reference": "nms6uvr1pl"8  }9}
```

The `data` object of the response contains an `access_code` parameter that's needed to complete the transaction. You should store this parameter and send it to your frontend.

Never call the Paystack API directly from your frontend to avoid exposing your secret key on the frontend. All requests to the Paystack API should be initiated from your server, and your frontend gets the response from your server.

### Complete transaction

Your frontend app should make a request to your backend to initialize the transaction and get the `access_code` as described in the previous section. On getting the `access_code` from your backend, you can then use Popup to complete the transaction:

```javascript
1const popup = new PaystackPop()2popup.resumeTransaction(access_code)
```

The `resumeTransaction` method triggers the checkout in the browser, allowing the user to choose their preferred payment channel to complete the transaction. You can check out [the InlineJS reference guide](https://paystack.com/docs/developer-tools/inlinejs/) to learn about the features available in Popup V2.

### Verify transaction status

Finally, you need to confirm the status of the transaction by [using either webhooks](https://paystack.com/docs/payments/webhooks/) or the [verify transactions endpoint](https://paystack.com/docs/payments/verify-payments/). Regardless of the method used, you need to use the following parameter to confirm if you should deliver value to your customer or not:

| Parameter | Description |
| --- | --- |
| `data.status` | This indicates if the payment is successful or not |
| `data.amount` | This indicates the price of your product or service in the lower denomination of your currency. |

When verifying the status of a transaction, you should also verify the amount to ensure it matches the value of the service you are delivering. If the amount doesn't match, don't deliver value to the customer.

## Redirect

Here, you call the [Initialize TransactionAPI](https://paystack.com/docs/api/transaction#initialize) from your server to generate a checkout link, then redirect your users to the link so they can pay. After payment is made, the users are returned to your website at the `callback_url`

Confirm that your server can conclude a TLSv1.2 connection to Paystack's servers. Most up-to-date software have this capability. Contact your service provider for guidance if you have any SSL errors.

### Collect customer information

To initialize the transaction, you'll need to pass information such as email, first name, last name amount, transaction reference, etc. Email and amount are required. You can also pass any other additional information in the `metadata` object field.

The customer information can be retrieved from your database, session or cookie if you already have it stored, or from a form like in the example below.

-   HTML

```
1<form action="/save-order-and-pay" method="POST"> 2  <input type="hidden" name="user_email" value="<?php echo $email; ?>"> 3  <input type="hidden" name="amount" value="<?php echo $amount; ?>"> 4  <input type="hidden" name="cartid" value="<?php echo $cartid; ?>"> 5  <button type="submit" name="pay_now" id="pay-now" title="Pay now">Pay now</button>6</form>
```

### Initialize transaction

When a customer clicks the payment action button, initialize a transaction by making a POST request to our API. Pass the email, amount and any other parameters to the [Initialize TransactionAPI](https://paystack.com/docs/api/transaction#initialize) endpoint.

If the API call is successful, we will return an authorization URL which you will redirect to for the customer to input their payment information to complete the transaction.

**Important notes**

1.  The `amount` should be in the subunit of the [supported currency](https://paystack.com/api#supported-currency).
2.  We used the `cart_id` from the form above as our transaction `reference`. You should use a unique transaction identifier from your system as your reference.
3.  We set the `callback_url` in the transaction\_data array. If you don't do this, we'll use the one that's set [on your dashboard](https://dashboard.paystack.co/#/settings/developer) or [on canvas](https://dashboard.paystack.com/v2/developers). Setting it in the code allows you to be flexible with the redirect URL if you need to
4.  If you don't set a callback URL on the dashboard or on the code, the users won't be redirected back to your site after payment.
5.  You can set test callback URLs for test transactions and live callback URLs for live transactions.

-   PHP

```
1<?php2  $url = "https://api.paystack.co/transaction/initialize";3
4  $fields = [5    'email' => "customer@email.com",6    'amount' => "20000",7    'callback_url' => "https://hello.pstk.xyz/callback",8    'metadata' => ["cancel_action" => "https://your-cancel-url.com"]9  ];10
11  $fields_string = http_build_query($fields);12
13  14  $ch = curl_init();15  16  17  curl_setopt($ch,CURLOPT_URL, $url);18  curl_setopt($ch,CURLOPT_POST, true);19  curl_setopt($ch,CURLOPT_POSTFIELDS, $fields_string);20  curl_setopt($ch, CURLOPT_HTTPHEADER, array(21    "Authorization: Bearer SECRET_KEY",22    "Cache-Control: no-cache",23  ));24  25  26  curl_setopt($ch,CURLOPT_RETURNTRANSFER, true); 27  28  29  $result = curl_exec($ch);30  echo $result;31?>
```

### Verify transaction

If the transaction is successful, Paystack will redirect the user back to a `callback_url` you set. We'll append the transaction reference in the URL. In the example above, the user will be redirected to `http://your_website.com/postpayment_callback.php?reference=YOUR_REFERENCE`.

So you retrieve the reference from the URL parameter and use that to call the verify endpoint to confirm the status of the transaction. Learn more about [verifying transactions](https://paystack.com/docs/payments/verify-payments/).

It's very important that you call the Verify endpoint to confirm the status of the transactions before delivering value. Just because the `callback_url` was visited doesn't prove that transaction was successful.

### Handle webhook

When a payment is successful, Paystack sends a `charge.success` webhook event to webhook URL that you provide. Learn more about using [webhooks](https://paystack.com/docs/payments/webhooks/).

## Mobile SDKs

With our mobile SDKs, we provide a collection of methods and interfaces tailored to the aesthetic of the platform. Transactions are initiated on the server and completed in the SDK. The SDK requires an `access_code` to display the UI component that accepts payment.

To get the `access_code`, you need to initialize a transaction by making a `POST` request on your server to the [Initialize TransactionAPI](https://paystack.com/docs/api/transaction#initialize) endpoint:

```
1curl https://api.paystack.co/transaction/initialize2-H "Authorization: Bearer YOUR_SECRET_KEY"3-H "Content-Type: application/json"4-d '{ "email": "customer@email.com", 5      "amount": "500000"6    }'7-X POST
```

```
1{2  "status": true,3  "message": "Authorization URL created",4  "data": {5    "authorization_url": "https://checkout.paystack.com/nkdks46nymizns7",6    "access_code": "nkdks46nymizns7",7    "reference": "nms6uvr1pl"8  }9}
```

On a successful initialization of the transaction, you get a response that contains an `access_code`. You need to return this `access_code` back to your mobile app.

Don't make an API request to the Initialize Transaction endpoint directly on your mobile app because it requires your secret key. Your secret key should only be used on your server where stronger security measures can be put in place.

With the `access_code` in place, you can now use the SDKs to complete the transaction.

### Android SDK

You need to install the SDK by adding the `paystack-ui` dependency to the `dependencies` block of your app-level `build.gradle` file:

You should check [Maven Central](https://central.sonatype.com/artifact/com.paystack.android/paystack-ui/versions) to get the latest version before installation.

-   build.gradle

```
1dependencies {2  implementation 'com.paystack.android:paystack-ui:0.0.9'3}
```

With all the requirements for accepting payment now in place, you can initialize and use the SDK as shown below:

-   Kotlin
-   Java

```
12
3import com.paystack.android.core.Paystack4import com.paystack.android.ui.paymentsheet.PaymentSheet5import com.paystack.android.ui.paymentsheet.PaymentSheetResult6
7class MainActivity : AppCompatActivity() {8    private lateinit var paymentSheet: PaymentSheet9
10    override fun onCreate(savedInstanceState: Bundle?) {11        super.onCreate(savedInstanceState)12        13
14        Paystack.builder()15            .setPublicKey("pk_test_xxxx")16            .build()17        paymentSheet = PaymentSheet(this, ::paymentComplete)18
19    }20
21    private fun makePayment() {22        23        paymentSheet.launch("br6cgmvflhn3qtd")24    }25
26
27    private fun paymentComplete(paymentSheetResult: PaymentSheetResult) {28        val message = when (paymentSheetResult) {29            PaymentSheetResult.Cancelled -> "Cancelled"30            is PaymentSheetResult.Failed -> {31                Log.e("Something went wrong", paymentSheetResult.error.message.orEmpty(), paymentSheetResult.error)32                paymentSheetResult.error.message ?: "Failed"33            }34
35            is PaymentSheetResult.Completed -> {36                37                Log.d("Payment successful", paymentSheetResult.paymentCompletionDetails.toString())38                "Successful"39            }40        }41    }42}
```

You can check out the [Android SDK reference](https://paystack.com/docs/developer-tools/android-sdk/) to learn more about the methods and interfaces available for integration.

### iOS SDK

The installation of the SDK can be done via the [Swift Package Manager](https://www.swift.org/documentation/package-manager/). To add the required packages, ensure you have the [latest version of XCode](https://developer.apple.com/xcode/) installed and follow these steps:

1.  Select File > Add Package Dependencies…
2.  Copy [the repo URL and paste it](https://github.com/PaystackHQ/paystack-sdk-ios) in the search box of the package dependency popup

You can read the [Swift Package Manager documentation](https://developer.apple.com/documentation/xcode/adding-package-dependencies-to-your-app) to learn more about adding packages to your project.

With all the requirements for accepting payment now in place, you can initialize and use the SDK:

-   SwiftUI
-   UIKit

```
1import SwiftUI2import PaystackCore3import PaystackUI4
5struct PaymentView: View {6	let paystack = try? PaystackBuilder7			.newInstance8			.setKey("pk_domain_xxxxxxxx")9			.build()10
11	var body: some View {12		VStack(spacing: 8) {13			Text("Make Payemnt")14
15			paystack?.chargeUIButton(accessCode: "0peioxfhpn", onComplete: paymentDone) {16				Text("Initiate Payment")17			}18		}19		.padding()20	}21
22	func paymentDone(_ result: TransactionResult) {23		24		print(result)25	}26}27
28
```

You can check out the [iOS SDK reference](https://paystack.com/docs/developer-tools/ios-sdk/) to learn more about the methods and interfaces available for integration.

## Charge API

The [Create ChargeAPI](https://paystack.com/docs/api/charge#create) endpoint allows you to pass details of any payment channel directly to Paystack, along with the transaction details (`email`, `amount`, etc). We provide a couple of [payment channels](https://paystack.com/docs/payments/payment-channels/) that you can harness based on your use case.

### Use cases

The Charge API exposes the core components powering our checkout. Developers can use these component to develop solutions that will cater to their customers specific needs. Some of these needs include:

1.  Serving non-smartphone users. Some of your users might be using mobile phones that can't access the internet. With the charge API, you can initiate a payment request form your server and send a prompt for payment completion via phone numbers to these users.
2.  Harnessing mobile OS APIs for a better user experience. Some businesses offer their products via mobile apps (Android and iOS). Mobile operating systems provide a rich set of APIs that developers can take advantage of. One of such APIs allow developers to autofill an OTP in a form. There are also APIs for dialing codes. Developers can combine the charge API with the mobile OS APIs to provide a richer experience to their users.

Here is a sample payload to the Charge API containing transaction details and an object for a payment instrument - in this case Mobile money:

-   JSON

```
1{2  "amount": 1000,3  "email": "customer@email.com",4  "currency": "GHS",5  "mobile_money": {6    "phone": "0553241149",7    "provider": "MTN"8  }9}
```

### Handling charge API responses

When you call the [Create ChargeAPI](https://paystack.com/docs/api/charge#create) endpoint, the response contains a `data.status` which tells you what the next step in the process. Depending on the value in the `data.status`, you may need to prompt the user for an input as indicated in the response message (like OTP or pin or date of birth), or display an action that the user needs to complete on their device - like scanning a QR code or dialling a USSD code or redirecting to a 3DSecure page. So you follow the prompt on the `data.status` until there is no more user input required, then you listen for events via [webhooks](https://paystack.com/docs/payments/webhooks/).

For the steps that prompt for user input, you will be required to display a form to the user to collect the requested input and send it to the relevant endpoint as shown in the table below. For the steps that require the user to complete an action on their device, we recommend that you display a button for the user to confirm the payment after they have performed that action so that you can listen for events via [webhooks](https://paystack.com/docs/payments/webhooks/).

Below is the list of responses you can receive from the [Create ChargeAPI](https://paystack.com/docs/api/charge#create) endpoint and what you should do next:

| Value | Description |
| --- | --- |
| `pending` | Transaction is being processed. Call Check pending charge at least 10 seconds after getting this status to check status |
| `timeout` | Transaction has failed. You may start a new charge after showing `data.message` to user |
| `success` | Transaction is successful. You can now provide value |
| `send_birthday` | Customer's birthday is needed to complete the transaction. Show `data.display_text` to user with an input that accepts the birthdate and submit to the [Submit BirthdayAPI](https://paystack.com/docs/api/charge#submit-birthday) endpoint with reference and birthday |
| `send_otp` | Paystack needs OTP from customer to complete the transaction. Show `data.display_text` to user with an input that accepts OTP and submit the OTP to the [Submit OTPAPI](https://paystack.com/docs/api/charge#submit-otp) endpoint with reference and otp |
| `failed` | Transaction failed. No remedy for this, start a new charge after showing `data.message` to user |

### Handle webhook

When a payment is successful, Paystack sends a `charge.success` webhook event to webhook URL that you provide. It's highly recommended that you use [webhooks](https://paystack.com/docs/payments/webhooks/) to confirm the payment status before delivering value to your customers.