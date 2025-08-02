# Payment Gateway Integration Guide

This guide explains how to properly integrate payment gateways (Google Pay, PhonePe, UPI, Razorpay) into your apartment sharing application.

---

## Overview

Supported payment methods:

- Google Pay
- PhonePe
- UPI (any UPI-compatible app)
- Razorpay

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

## Payment Gateway Integration

- For Razorpay, see the UPI integration guide and Razorpay API documentation.
- For Google Pay and PhonePe, use their respective SDKs and follow the official documentation.
- UPI payments can be initiated via intent URLs or QR codes.

---

## Security Best Practices

- Never store sensitive payment data in your database
- Use HTTPS for all payment-related communications
- Implement webhook verification for payment callbacks
- Store only necessary transaction references
- Use environment variables for API keys and secrets
- Implement proper error handling and logging
- Add payment reconciliation processes

---

## Testing

- Use test cards and UPI IDs for development
- Verify payment flows in sandbox environments
- Monitor and log payment events

---

## Compliance

- PCI DSS standards
- RBI guidelines for digital payments
- Data protection regulations

---

## Production Considerations

- Replace demo payment logic with actual API calls
- Add server-side verification of transactions
- Set up webhook handlers for payment status updates
- Implement error handling and retry mechanisms
- Deploy with proper security measures

---

## Customizing the Payment Flow

- Extend the `PaymentMethod` type for more methods.
- Modify UI components in `payment-gateways.tsx`.
- Add additional validation steps before payment.

---

## Next Steps

- Choose payment gateway providers and register for merchant accounts
- Implement SDKs following the examples above
- Set up webhook endpoints for payment confirmations
- Test thoroughly in sandbox environments
- Deploy to production with proper security measures
