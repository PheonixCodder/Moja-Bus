# Custom Apps

.cls-1{fill:#001b35;}In A Nutshell

##### In a nutshell

You can build a custom android app to accept payment on the Paystack Terminal

## Introduction

Paystack Terminal is powered by the Android operating system (OS) allowing developers to build Android apps on the Terminal. The Android OS enables apps to [communicate with each other via Intents](https://developer.android.com/guide/components/intents-filters). With Intents, you can build an app that runs and accepts payments on Paystack Terminal.

##### Android API Level

We currently have two Terminal devices that run on Android 5.1 and Android 10 respectively. You should take note of the [privacy changes](https://developer.android.com/about/versions/10/privacy/changes#top-changes) between both OS versions if you are building for both devices.

## Building an intent

##### Hybrid stack

This document highlights how to build using the Java/Kotlin. If you are building with Flutter or React Native, check out the [Flutter](https://paystack.com/docs/guides/building_terminal_apps_flutter/) or [React Native](https://paystack.com/docs/guides/building_terminal_apps_react_native/) guide.

When implementing the payment flow for your custom app, you need to [utilize an intent](https://developer.android.com/guide/components/intents-filters#Building) to communicate with the Paystack terminal app. An intent allows you to specify the particular app that should process your request. In this case, you’ll be specifying the Paystack terminal app to process payment for your app.

You can pass the following parameters when creating the intent for the Paystack terminal app:

| Parameter | Description | Value |
| --- | --- | --- |
| Component name | The package name of the Paystack Terminal app | `com.paystack.pos` |
| Action | A generic string capturing the operation to perform | `Intent.ACTION_VIEW` |
| Extras | A key-value pair required to perform the desired operation. The keys will include the app's package name as a prefix. For example, `com.paystack.pos.SETTINGS` | Check the supported operations table below |

### Supported operations

These are the operations currently available on the terminal:

| Operation | Extra key | Result code |
| --- | --- | --- |
| Fetch terminal details | `com.paystack.pos.PARAMETERS` | 12 |
| Initiate a transaction | `com.paystack.pos.TRANSACT` | 14 |
| Open terminal settings | `com.paystack.pos.SETTINGS` | \- |

### Intent response

All supported operations, except the terminal settings, return a response with the following structure:

-   Kotlin
-   Java

```
1data class PaystackIntentResponse (2  val intentKey: String,3  val intentResponseCode: Int,4  val intentResponse: TerminalResponse5)6
```

| Parameter | Description |
| --- | --- |
| `intentKey` | This is the key passed into the `putExtra` method when initializing the intent. Possible values are listed in the **Extra key** column of the Supported Operations table |
| `intentResponseCode` | This is the intent result code. Possible values are listed in the Result code column of the [Supported Operations](https://paystack.com/docs/terminal/custom-apps/#supported-operations) table |
| `intentResponse` | This is the response of the operation performed |

-   Kotlin
-   Java

```
1data class TerminalResponse(2  val statusCode: String,3  val message: String,4  val data: String5)6
```

| Parameter | Description |
| --- | --- |
| `statusCode` | We use [HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) to represent the status of the response |
| `message` | A short summary of the response |
| `data` | This is a serialized object (JSON string) containing the result of your request. It can be deserialized into the respective object based on the operation being performed |

## Accept payment

To initiate a payment, you need to create an instance of the `TransactionRequest` object:

-   Kotlin
-   Java

```
1data class TransactionRequest(2  val amount: Int,3  val offlineReference: String?,4  val supplementaryReceiptData: SupplementaryReceiptData?,5  val metadata: Map<String, Any>?6)7
```

| Parameter | Required? | Description |
| --- | --- | --- |
| `amount` | Yes | The amount to charge the customer. The amount should be in kobo |
| `offlineReference` | No | This is a unique identifier for an invoice. You can set this value if you want to accept payment for a previously created invoice |
| `supplementaryReceiptData` | No | Extra details to add to the receipt on successful payment |
| `metadata` | No | Extra data to append to the transaction |

-   Kotlin
-   Java

```
1data class SupplementaryReceiptData(2  val developerSuppliedText: String?,3  val developerSuppliedImageUrlPath: String?,4  val barcodeOrQrcodeImageText: String?,5  val textImageType: TextImageFormat?6)7
```

| Parameter | Description |
| --- | --- |
| `developerSuppliedText` | An extra text to add to the printed receipt |
| `developerSuppliedImageUrlPath` | A publicly accessible URL for an image to be added to the receipt |
| `barcodeOrQrcodeImageText` | A text to be used to generate a barcode or QR code |
| `textImageType` | Specify the type of encoding for the image text |

-   Kotlin
-   Java

```
1enum class TextImageFormat {2  QR_CODE, 3  AZTEC_BARCODE4}5
```

The instance of the `TransactionRequest` is then passed as an extra in your intent object:

-   Kotlin
-   Java

```
1val gson = Gson()2
3private fun makePayment() {4  val transactionRequest = TransactionRequest(5    amount = 2000,6    offlineReference = null,7    supplementaryReceiptData = null,8    metadata = mapOf(9      "custom_fields" to listOf(10        CustomField(11          display_name = "Extra Detail",12          variable_name = "extra_detail",13          value = "1234"14        )15      )16    )17  )18
19  val transactionIntent = Intent(Intent.ACTION_VIEW).apply {20    setPackage("com.paystack.pos")21    putExtra("com.paystack.pos.TRANSACT", gson.toJson(transactionRequest))22  }23
24  // implementation below25  startActivityForResult.launch(transactionIntent)26}27
```

Using the [StartActivityForResult](https://developer.android.com/training/basics/intents/result) contract, the result can be parsed as follows:

-   Kotlin
-   Java

```
1val TRANSACTION_RESULT_CODE = 142val TRANSACTION = "com.paystack.pos.TRANSACT"3val startActivityForResult: ActivityResultLauncher<Intent>  = registerForActivityResult(StartActivityForResult(), intentResultCallback())4
5private fun intentResultCallback(): ActivityResultCallback<ActivityResult> {6
7  return ActivityResultCallback { result: ActivityResult ->8    val resultCode = result.resultCode9    val intent = result.data10    val paystackIntentResponse: PaystackIntentResponse11    val terminalResponse: TerminalResponse12
13    if (resultCode == TRANSACTION_RESULT_CODE) {14      paystackIntentResponse = gson.fromJson(15        intent?.getStringExtra(TRANSACTION),16        PaystackIntentResponse::class.java17      )18      terminalResponse = paystackIntentResponse.intentResponse19      val transactionResponse: TransactionResponse = gson.fromJson(20        terminalResponse.data,21        TransactionResponse::class.java22      )23
24      Toast.makeText(25        applicationContext,26        "Transaction ref: " + transactionResponse.reference,27        Toast.LENGTH_SHORT28      ).show()29    }30    else {31      // handle invalid result code 32    }33  }34}
```

When the payment is completed, the response returned is an instance of the `TransactionResponse` object:

-   Kotlin
-   Java

```
1import com.google.gson.annotations.SerializedName2
3data class TransactionResponse(4  val id: String?,5  val amount: Int?,6  val reference: String?,7  val status: String?,8  val currency: String?,9  @SerializedName("country_code")10  val countryCode: String?,11  @SerializedName("paid_at")12  val paidAt: String?,13  val terminal: String?14)
```

## Fetch terminal details

Each terminal has a unique identifier and serial number attached to it. To fetch these details, you can construct an intent as follows:

-   Kotlin
-   Java

```
1private fun fetchParameters(){2  val parametersIntent = Intent(Intent.ACTION_VIEW).apply {3    setPackage("com.paystack.pos")4    putExtra("com.paystack.pos.PARAMETERS", "true")5  }6
7  // implementation below8  startActivityForResult.launch(parametersIntent)9}10
```

Using the `StartActivityForResult` contract, the result can be parsed as follows:

-   Kotlin
-   Java

```
1val PARAMETERS_RESULT_CODE = 122val PARAMETERS = "com.paystack.pos.PARAMETERS"3val startActivityForResult: ActivityResultLauncher<Intent>  = registerForActivityResult(StartActivityForResult(), intentResultCallback())4
5private fun intentResultCallback(): ActivityResultCallback<ActivityResult> {6
7  return ActivityResultCallback { result: ActivityResult ->8    val resultCode = result.resultCode9    val intent = result.data10    val paystackIntentResponse: PaystackIntentResponse11    val terminalResponse: TerminalResponse12
13    if (resultCode == PARAMETERS_RESULT_CODE) {14      paystackIntentResponse = gson.fromJson(15        intent?.getStringExtra(PARAMETERS),16        PaystackIntentResponse::class.java17      )18      terminalResponse = paystackIntentResponse.intentResponse19      val parameters: ParameterResponse = gson.fromJson(20        terminalResponse.data,21        ParameterResponse::class.java22      )23      Toast.makeText(24        applicationContext,25        "Terminal ID: " + parameters.terminalId,26        Toast.LENGTH_SHORT27      ).show()28
29      Toast.makeText(30        applicationContext,31        "Terminal Serial Number: " + parameters.serialNumber,32        Toast.LENGTH_SHORT33      ).show()34    }35    else {36      // handle invalid result code 37    }38  }39}
```

The result is an instance of the `PaystackIntentResponse` class. Parsing the result gives access to the terminal details, which is an instance of the `ParametersResponse` class:

-   Kotlin
-   Java

```
1import com.google.gson.annotations.SerializedName2
3data class ParametersResponse(4  @SerializedName("terminal_id")5  val terminalId: String,6  @SerializedName("serial_number")7  val serialNumber: String8)9
```

## Open terminal settings

The terminal settings activity allows you to perform administrative operations. You can programmatically open the settings page of the Terminal app from your app by passing the `com.paystack.pos.SETTINGS` extra in your Intent. This action doesn’t return a result so you’ll make use of the `startActivity` method to trigger the intent:

-   Kotlin
-   Java

```
1private fun openSettings() {2  val settingsIntent = Intent(Intent.ACTION_VIEW).apply {3    setPackage("com.paystack.pos")4    putExtra("com.paystack.pos.SETTINGS",  "true")5  }6
7  startActivity(settingsIntent)8}9
```

## Integration checklist

-   Ensure [HTTPS is enabled](https://developer.android.com/training/articles/security-ssl) on your app
-   The Android OS places a limit on the payload size that one app can send to another. You should [check the limit](https://developer.android.com/guide/components/activities/parcelables-and-bundles#sdbp) and ensure you aren't exceeding it.

## Publishing your app

Upon the completion of the development and testing of your app, you would want to make it available on all your terminal device. We manage an app store that allows us to make your app available to your devices only. There are four steps to get your app deployed on all your devices:

1.  Generate your app APK
2.  Indicate interest in deploying a custom app [via this form](https://airtable.com/shrYM4gBRvgLakQOg) and we'll send you detailed guidelines for deployment
3.  Complete a preliminary scan following step 2 above
4.  Send us your APK

When we receive your submission, we’ll conduct a security review to ensure the app is safe for public use. Once the app is certified as safe, we’ll deploy your app to all your terminals. However, if the app doesn't pass the security review, we will share a document with feedback on remediation.

###### On this Page

-   [Introduction](https://paystack.com/docs/terminal/custom-apps/#introduction)
-   [Building an intent](https://paystack.com/docs/terminal/custom-apps/#building-an-intent)
-   [Accept payment](https://paystack.com/docs/terminal/custom-apps/#accept-payment)
-   [Fetch terminal details](https://paystack.com/docs/terminal/custom-apps/#fetch-terminal-details)
-   [Open terminal settings](https://paystack.com/docs/terminal/custom-apps/#open-terminal-settings)
-   [Integration checklist](https://paystack.com/docs/terminal/custom-apps/#integration-checklist)
-   [Publishing your app](https://paystack.com/docs/terminal/custom-apps/#publishing-your-app)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)