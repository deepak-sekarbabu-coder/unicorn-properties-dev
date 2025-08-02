# Payment Gateway Integration Guide

This guide explains how to properly integrate payment gateways (Google Pay, PhonePe, UPI) into your apartment sharing application.

---

## Overview

Supported payment methods:

- Google Pay
- PhonePe
- UPI (any UPI-compatible app)

---

## Demo Implementation

- Demo payments do not have Firestore document IDs.
- `DemoPaymentGateways` component simulates payment flow without database dependencies.
- Proper error handling is included.
- Demo page: `/payment-demo` allows users to create, view, and process test payment requests.

---

## Components

### PaymentGateways Component

```tsx
import { PaymentGateways, PaymentRequest } from '@/components/payment-gateways';

const paymentRequest: PaymentRequest = {
  amount: 500,
  description: 'Monthly Maintenance',
  fromApartmentId: 'apt-123',
  fromApartmentName: 'Apartment A',
  toApartmentId: 'apt-456',
  toApartmentName: 'Building Management',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'pending',
};

<PaymentGateways
  paymentRequest={paymentRequest}
  onPaymentComplete={(transactionId, method) => {
    console.log(`Payment completed with ID: ${transactionId} using ${method}`);
  }}
  onCancel={() => {}}
/>;
```

### PaymentRequestCard Component

```tsx
import { PaymentRequestCard } from '@/components/payment-request-card';

<PaymentRequestCard
  id="payment-123"
  fromApartmentName="Building Management"
  amount={1250}
  description="Monthly Maintenance"
  createdAt={new Date().toISOString()}
  dueDate={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()}
  status="pending"
  onPaymentComplete={() => {}}
  onDismiss={() => {}}
/>;
```

---

## Proper Payment Gateway Integration

### 1. Google Pay Integration

#### Setup

```bash
npm install @google-pay/button-react
```

#### Implementation

```typescript
import { GooglePayButton } from '@google-pay/button-react';

const GooglePayComponent = ({ amount, onSuccess, onError }) => (
  <GooglePayButton
    environment="TEST"
    paymentRequest={{
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'example',
              gatewayMerchantId: 'exampleGatewayMerchantId',
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: 'your-merchant-id',
        merchantName: 'Your App Name',
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPriceLabel: 'Total',
        totalPrice: amount.toString(),
        currencyCode: 'INR',
      },
    }}
    onLoadPaymentData={onSuccess}
    onError={onError}
  />
);
```

### 2. PhonePe Integration

#### Setup

```bash
npm install phonepe-payment-sdk
```

#### Implementation

```typescript
import { PhonePePayment } from 'phonepe-payment-sdk';

const initiatePhonePePayment = async paymentData => {
  try {
    const payment = new PhonePePayment({
      merchantId: 'your-merchant-id',
      apiKey: 'your-api-key',
      environment: 'sandbox',
    });

    const paymentRequest = {
      merchantTransactionId: `TX${Date.now()}`,
      merchantUserId: paymentData.userId,
      amount: paymentData.amount * 100,
      redirectUrl: 'https://yourapp.com/payment/callback',
      redirectMode: 'POST',
      callbackUrl: 'https://yourapp.com/api/payment/callback',
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const response = await payment.initiatePayment(paymentRequest);
    if (response.success) {
      window.location.href = response.data.instrumentResponse.redirectInfo.url;
    }
  } catch (error) {
    console.error('PhonePe payment error:', error);
  }
};
```

### 3. UPI Integration

#### Using UPI Intent URLs

```typescript
const initiateUPIPayment = paymentData => {
  const upiUrl = `upi://pay?pa=${paymentData.vpa}&pn=${paymentData.payeeName}&am=${paymentData.amount}&cu=INR&tn=${paymentData.description}`;
  if (/Android|iPhone/i.test(navigator.userAgent)) {
    window.location.href = upiUrl;
  } else {
    generateQRCode(upiUrl);
  }
};
```

---

## Database Structure

### Payment Records Collection

```typescript
interface Payment {
  id: string;
  amount: number;
  currency: string;
  description: string;
  fromApartmentId: string;
  toApartmentId: string;
  fromUserId: string;
  toUserId: string;
  transactionId: string;
  paymentMethod: 'googlepay' | 'phonepay' | 'upi' | 'card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gatewayResponse?: any;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

### Payment Requests Collection

```typescript
interface PaymentRequest {
  id: string;
  amount: number;
  description: string;
  fromApartmentId: string;
  fromApartmentName: string;
  toApartmentId: string;
  toApartmentName: string;
  fromUserId: string;
  toUserId: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  paymentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Secure Payment Processing

### Backend API Endpoint Example

```typescript
// pages/api/payments/process.ts
import { NextApiRequest, NextApiResponse } from 'next';

import { updatePaymentStatus } from '@/lib/firestore';
import { verifyPayment } from '@/lib/payment-verification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { paymentData, gatewayResponse } = req.body;
    const isValid = await verifyPayment(gatewayResponse);
    if (isValid) {
      await updatePaymentStatus(paymentData.id, {
        status: 'completed',
        transactionId: gatewayResponse.transactionId,
        gatewayResponse,
        completedAt: new Date(),
      });
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Security Best Practices

1. Never store sensitive payment data in your database
2. Use HTTPS for all payment-related communications
3. Implement webhook verification for payment callbacks
4. Store only necessary transaction references
5. Use environment variables for API keys and secrets
6. Implement proper error handling and logging
7. Add payment reconciliation processes

---

## Testing

### Test Environment Setup

```typescript
const paymentConfig = {
  googlePay: {
    environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST',
    merchantId: process.env.GOOGLE_PAY_MERCHANT_ID,
  },
  phonePe: {
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    apiKey: process.env.PHONEPE_API_KEY,
  },
};
```

### Test Cards for Google Pay

- Visa: 4111111111111111
- Mastercard: 5555555555554444

---

## Error Handling

```typescript
const handlePaymentError = (error: any, method: string) => {
  console.error(`${method} payment error:`, error);
  logError({
    type: 'payment_error',
    method,
    error: error.message,
    timestamp: new Date(),
  });
  toast.error('Payment Failed', {
    description: 'Please try again or use a different payment method.',
  });
};
```

---

## Monitoring and Analytics

Track important payment metrics:

- Payment success/failure rates
- Popular payment methods
- Average transaction amounts
- Payment completion times

---

## Compliance

Ensure compliance with:

- PCI DSS standards
- RBI guidelines for digital payments
- Data protection regulations
- KYC requirements if applicable

---

## Production Considerations

1. Replace demo payment logic with actual API calls to Google Pay and PhonePe.
2. Add server-side verification of transactions.
3. Set up webhook handlers for payment status updates.
4. Implement error handling and retry mechanisms.
5. Monitor and log payment events.
6. Deploy with proper security measures.

---

## Customizing the Payment Flow

- Extend the `PaymentMethod` type for more methods.
- Modify UI components in `payment-gateways.tsx`.
- Add additional validation steps before payment.

---

## Next Steps

1. Choose payment gateway providers and register for merchant accounts
2. Implement SDKs following the examples above
3. Set up webhook endpoints for payment confirmations
4. Test thoroughly in sandbox environments
5. Implement monitoring and error tracking
6. Deploy to production with proper security measures

---

## Demo vs Production

- ✅ Shows UI/UX flow
- ✅ Simulates payment processing
- ✅ Handles success/error states
- ❌ Doesn't process real payments
- ❌ Doesn't integrate with actual gateways

For production, replace the demo components with actual SDK integrations following this guide.
