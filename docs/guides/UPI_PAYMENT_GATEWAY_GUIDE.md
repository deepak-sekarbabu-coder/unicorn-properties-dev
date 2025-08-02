<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Step-by-Step Guide: Integrating UPI Payment Gateway in Your Next.js Application

This comprehensive guide will walk you through integrating a UPI payment gateway (specifically Razorpay) into your Next.js application hosted on Netlify, using Firebase for authentication and Firestore for database operations.

## Prerequisites

Before starting, ensure you have:

- A Next.js application set up
- Firebase project configured with Authentication and Firestore
- Netlify account for hosting
- Razorpay account (supports UPI payments in India)

## Step 1: Install Required Dependencies

Install the necessary packages for payment integration:

```bash
npm install razorpay @types/razorpay axios crypto
npm install firebase firebase-admin  # If not already installed
```

## Step 2: Set Up Environment Variables

### On Netlify

1. Go to your Netlify dashboard
2. Navigate to **Site settings > Environment variables**
3. Add the following environment variables[^1][^2]:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_ADMIN_SDK_KEY=your_firebase_admin_sdk_json
```

### Local Development

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_ADMIN_SDK_KEY=your_firebase_admin_sdk_json
```

## Step 3: Configure Firebase Admin SDK

Create `lib/firebase-admin.js`:

```javascript
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
```

## Step 4: Create Order Creation API Route

Create `app/api/createOrder/route.ts`[^3]:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/firebase-admin";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, userId, productId } = await request.json();

    if (!amount || !userId) {
      return NextResponse.json(
        { message: "Amount and userId are required" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Store order in Firestore
    const orderData = {
      orderId: order.id,
      razorpayOrderId: order.id,
      amount: amount,
      currency: currency || "INR",
      userId: userId,
      productId: productId || null,
      status: "created",
      createdAt: new Date(),
    };

    await db.collection("orders").doc(order.id).set(orderData);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { message: "Failed to create order", error },
      { status: 500 }
    );
  }
}
```

## Step 5: Create Payment Verification API Route

Create `app/api/verifyPayment/route.ts`[^3]:

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Update order status in Firestore
    const orderRef = db.collection("orders").doc(razorpay_order_id);
    await orderRef.update({
      status: "paid",
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paidAt: new Date(),
    });

    // Update user's payment status if needed
    if (userId) {
      await db.collection("users").doc(userId).update({
        lastPayment: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: (await orderRef.get()).data()?.amount,
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
```

## Step 6: Create Webhook Handler (Optional but Recommended)

Create `app/api/webhook/razorpay/route.ts` for handling Razorpay webhooks[^4]:

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac("sha256", webhookSecret as string);
    hmac.update(body);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      default:
        console.log(`Unhandled event: ${event.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  const orderRef = db.collection("orders").doc(payment.order_id);
  await orderRef.update({
    status: "captured",
    webhookProcessedAt: new Date(),
  });
}

async function handlePaymentFailed(payment: any) {
  const orderRef = db.collection("orders").doc(payment.order_id);
  await orderRef.update({
    status: "failed",
    webhookProcessedAt: new Date(),
  });
}
```

## Step 7: Create Payment Component

Create `components/PaymentButton.tsx`[^3]:

```typescript
"use client";
import React, { useState } from "react";
import Script from "next/script";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

interface PaymentButtonProps {
  amount: number;
  productId?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

export default function PaymentButton({
  amount,
  productId,
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      alert("Please login to make a payment");
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const orderResponse = await fetch("/api/createOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          userId: user.uid,
          productId,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message);
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Your Company Name",
        description: "Payment for your order",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/verifyPayment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.uid,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              alert("Payment successful!");
              onSuccess?.(response);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
            onError?.(error);
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        theme: {
          color: "#3399cc",
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        alert("Payment failed. Please try again.");
        onError?.(response.error);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Processing..." : `Pay ₹${amount}`}
      </button>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
    </>
  );
}
```

## Step 8: Set Up Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection - users can only read their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users collection - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 9: Configure Netlify Deployment

Create `netlify.toml` in your project root[^5]:

```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = ".next"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[context.production.environment]
  NODE_ENV = "production"

[context.deploy-preview.environment]
  NODE_ENV = "development"
```

## Step 10: Usage Example

```typescript
import PaymentButton from "@/components/PaymentButton";

export default function ProductPage() {
  const handlePaymentSuccess = (response: any) => {
    console.log("Payment successful:", response);
    // Redirect to success page or update UI
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
    // Handle error state
  };

  return (
    <div className="p-6">
      <h1>Premium Plan</h1>
      <p>Get access to premium features</p>
      
      <PaymentButton
        amount={999}
        productId="premium-plan"
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
```

## Step 11: Testing

### Test Mode Setup

1. Use Razorpay test keys for development
2. Use test UPI ID: `success@razorpay` for successful payments
3. Use test card: `4111 1111 1111 1111` for card payments

### Local Testing

```bash
npm run dev
```

### Production Testing

Deploy to Netlify and test with real payment methods.

## Security Best Practices

1. **Never expose secret keys** on the client side[^3]
2. **Always verify payments** on the server side
3. **Use HTTPS** for all payment-related requests
4. **Implement proper error handling** for failed transactions
5. **Set up webhook verification** to handle payment status updates
6. **Use Firestore security rules** to protect user data
7. **Implement rate limiting** for API endpoints

## Troubleshooting

### Common Issues

1. **Environment variables not loaded**: Ensure variables are set correctly in Netlify dashboard
2. **CORS errors**: Check API route configurations
3. **Payment verification fails**: Verify webhook secret and signature generation
4. **Firestore permission denied**: Check security rules and user authentication

### Debugging Steps

1. Check Netlify function logs for errors
2. Verify Razorpay webhook delivery in dashboard
3. Monitor Firestore for data updates
4. Test with different payment methods (UPI, cards, net banking)

This comprehensive integration provides a secure, scalable payment solution for your Next.js application with UPI support, proper authentication, and reliable data storage using Firebase and Netlify hosting.

<div style="text-align: center">⁂</div>

[^1]: <https://docs.netlify.com/build/environment-variables/overview/>

[^2]: <https://docs.netlify.com/environment-variables/get-started/>

[^3]: <https://dev.to/hanuchaudhary/how-to-integrate-razorpay-in-nextjs-1415-with-easy-steps-fl7>

[^4]: <https://www.youtube.com/watch?v=oWK7kesoCQY>

[^5]: <https://www.freecodecamp.org/news/serverless-online-payments/>































































