# Mastering Paystack: A Developer’s Guide to Secure, Scalable Payments in Next.js

Building a checkout flow is easy. Building a **secure, resilient, and production-ready** checkout flow is where most developers stumble.

If you’ve ever worried about a user closing their tab before a transaction finishes, or a malicious actor “faking” a successful payment response in the browser console, this guide is for you. We’re going to integrate Paystack into a modern **Next.js (App Router)** environment using the “Trust but Verify” architecture.

## The Architecture: Why the Frontend Isn’t Enough

In a naive integration, you trigger a pop-up, wait for a `success` callback, and then update your database. **This is a security nightmare.** A savvy user can intercept that frontend call and tell your database they paid when they didn’t.To build a professional system, we use a **triangular communication flow**:

1.  **The Client:** Initiates the payment and handles the UI.
2.  **Paystack:** Securely processes the credit card or money transfer.
3.  **The Server (Next.js):** Acts as the source of truth by verifying the transaction directly with Paystack’s backend.

## Environment Setup: Guarding Your Secrets

In Next.js, we must distinguish between what the browser can see and what must stay hidden. Create a `.env.local` file in your root directory:

Bash
```
# Public: Safe for the browser (prefixed with NEXT_PUBLIC)NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxx
```
```
# Secret: NEVER expose this to the frontendPAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxx
```


## The Frontend: The `PaystackButton` Component

We’ll use the `react-paystack` library for a polished experience. Notice how we pass a unique ID. This is the "ID" we will use later to verify the payment on the server.


TypeScript

```
'use client';import { PaystackButton } from 'react-paystack';
```

```
const CheckoutButton = ({ amount, email }: { amount: number; email: string }) => {  const config = {    reference: (new Date()).getTime().toString(), // Generate a unique ref    email,    amount: amount * 100, // Paystack expects Kobo/Cents    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,  };  const handleSuccess = (reference: any) => {    // 1. Show a loading state    // 2. Call our internal API to verify    window.location.href = `/verify?ref=${reference.reference}`;  };  return (    <PaystackButton       className="bg-blue-600 text-white px-6 py-3 rounded-md font-bold hover:bg-blue-700 transition"      {...config}       text="Pay Now"       onSuccess={handleSuccess}       onClose={() => alert("Transaction abandoned.")}    />  );};
```

## The “Source of Truth”: Server-Side Verification

This is the most important part of the article. We create a **Server Action** or an **API Route** that calls Paystack’s `/transaction/verify` endpoint.

TypeScript

```
// app/api/verify/route.tsimport { NextResponse } from 'next/server';
```

```
export async function GET(request: Request) {  const { searchParams } = new URL(request.url);  const reference = searchParams.get('ref');  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {    method: 'GET',    headers: {      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,    },  });  const data = await res.json();  if (data.data.status === 'success') {    // SUCCESS: Update your database here!    return NextResponse.redirect(new URL('/dashboard/success', request.url));  }  return NextResponse.json({ message: "Verification failed" }, { status: 400 });}
```

## Final Thoughts: Don’t Forget Webhooks

Even with server verification, what if the user’s battery dies _exactly_ after they pay but before the redirect happens? In a follow-up post, we’ll explore **Webhooks** Paystack’s way of “calling you” to say the money is in the bank, even if the user is offline.