"use client";
import React, { useState } from "react";
import Script from "next/script";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

interface PaymentButtonProps {
  amount: number;
  productId?: string;
  onSuccess?: (response: RazorpayPaymentResponse) => void;
  onError?: (error: RazorpayError | Error) => void;
}

interface RazorpayConstructor {
  new (options: any): RazorpayInstance;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, callback: (response: any) => void): void;
  // Add more methods as needed from Razorpay docs
}

// Razorpay global type declaration
declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export default function PaymentButton({ amount, productId, onSuccess, onError }: PaymentButtonProps) {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [upiId, setUpiId] = useState("success@razorpay");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");

  const handlePayment = async () => {
    if (!user) {
      alert("Please login to make a payment");
      return;
    }
    setIsLoading(true);
    try {
      // Fetch Razorpay key securely from backend
      const keyRes = await fetch("/api/razorpay-key");
      const keyData = await keyRes.json();
      if (!keyRes.ok || !keyData.key) throw new Error("Unable to fetch Razorpay key");
      const orderResponse = await fetch("/api/createOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency: "INR", userId: user.uid, productId }),
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.message);
      const options = {
        key: keyData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Unicorn Properties",
        description: "Apartment Payment",
        order_id: orderData.orderId,
        handler: async function (response: RazorpayPaymentResponse) {
          try {
            const verifyResponse = await fetch("/api/verifyPayment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.uid,
              }),
            });
            const verifyData = await verifyResponse.json();
            if (verifyResponse.ok && verifyData.success) {
              onSuccess?.(response);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            onError?.(error as Error);
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
          contact: "",
          method: upiId ? "upi" : "card",
          upi: { vpa: upiId },
          card: { number: cardNumber },
        },
        theme: { color: "#3399cc" },
        method: { upi: true, card: true, netbanking: true, wallet: true },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: { error: RazorpayError }) {
        onError?.(response.error);
      });
      razorpay.open();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Test UPI ID</label>
        <input
          type="text"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="border rounded px-2 py-1 w-full mb-2"
          placeholder="success@razorpay"
        />
        <label className="block text-sm font-medium mb-1">Test Card Number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="border rounded px-2 py-1 w-full"
          placeholder="4111 1111 1111 1111"
        />
      </div>
      <Button onClick={handlePayment} disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {isLoading ? "Processing..." : `Pay ₹${amount}`}
      </Button>
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
    </>
  );
}
