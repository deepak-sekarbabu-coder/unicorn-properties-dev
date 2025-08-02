'use client';

import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

import { useState } from 'react';

import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PaymentButton from '@/components/PaymentButton';
import Image from "next/image";

// Define payment method types
export type PaymentMethod = 'googlepay' | 'phonepay' | 'upi' | 'card' | 'razorpay';

// Payment request interface
export interface PaymentRequest {
  id?: string;
  amount: number;
  description: string;
  fromApartmentId: string;
  fromApartmentName: string;
  toApartmentId: string;
  toApartmentName: string;
  dueDate?: string;
  status: 'pending' | 'paid' | 'failed';
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  paidAt?: string;
  createdAt?: string;
}

interface PaymentGatewayProps {
  paymentRequest: PaymentRequest;
  onPaymentComplete?: (transactionId: string, method: PaymentMethod) => void;
  onCancel?: () => void;
}

// Define a type for the error object
interface PaymentError {
  message?: string;
  description?: string;
}

export function PaymentGateways({
  paymentRequest,
  onPaymentComplete,
  onCancel,
}: PaymentGatewayProps) {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');

  // For demonstration purposes - in real implementation, this would be replaced
  // with actual Google Pay or PhonePay SDK implementations
  const processPayment = async (method: PaymentMethod) => {
    if (!user) {
      setError('You must be logged in to make a payment');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // In a real implementation, this is where you'd integrate with the
      // actual payment gateway APIs for GooglePay or PhonePe

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a mock transaction ID
      const mockTransactionId = `TX${Date.now().toString().substring(5)}`;
      setTransactionId(mockTransactionId);

      // Update payment status in database
      await updatePaymentStatus(mockTransactionId, method);

      setIsPaymentSuccessful(true);

      // Call the callback if provided
      if (onPaymentComplete) {
        onPaymentComplete(mockTransactionId, method);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setError(
        error instanceof Error ? error.message : 'Payment processing failed. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePaymentStatus = async (txId: string, method: PaymentMethod) => {
    try {
      // Update notification as paid
      if (paymentRequest.id) {
        await updateDoc(doc(db, 'notifications', paymentRequest.id), {
          status: 'paid',
          paymentMethod: method,
          transactionId: txId,
          paidAt: new Date().toISOString(),
        });
      }

      // Add payment record
      await addDoc(collection(db, 'payments'), {
        amount: paymentRequest.amount,
        currency: '₹',
        description: paymentRequest.description,
        fromApartmentId: paymentRequest.fromApartmentId,
        toApartmentId: paymentRequest.toApartmentId,
        transactionId: txId,
        paymentMethod: method,
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      // Create notification for payment sender
      const notification: Omit<Notification, 'id'> = {
        type: 'payment_confirmed',
        title: `Payment to ${paymentRequest.toApartmentName} Confirmed`,
        message: `Your payment of ₹${paymentRequest.amount.toFixed(2)} for "${paymentRequest.description}" has been completed.`,
        amount: paymentRequest.amount,
        currency: '₹',
        fromApartmentId: paymentRequest.fromApartmentId,
        toApartmentId: paymentRequest.toApartmentId,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'notifications'), notification);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment records');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="border-b">
        <CardTitle>Payment Options</CardTitle>
        <CardDescription>Choose your preferred payment method</CardDescription>
      </CardHeader>

      {!isPaymentSuccessful ? (
        <>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                Paying <span className="font-medium">₹{paymentRequest.amount.toFixed(2)}</span> to{' '}
                {paymentRequest.toApartmentName}
              </div>

              {/* Google Pay Option */}
              <div
                className={`border p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedMethod === 'googlepay' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedMethod('googlepay')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z"
                          fill="white"
                        />
                        <path
                          d="M24.3681 20.6153L28.7231 14.1395C29.0631 13.6407 28.8201 12.9656 28.2412 12.773L24.0021 11.3C23.5728 11.1547 23.097 11.3958 22.9517 11.8251L18.1709 24.3451L24.3681 20.6153Z"
                          fill="#EA4335"
                        />
                        <path
                          d="M32.9153 23.5342L29.9183 14.7795C29.774 14.3458 29.2931 14.105 28.8592 14.2491L18.17 17.9786L26.1767 36.7538C26.3208 37.1876 26.8018 37.4284 27.2357 37.2843L32.3851 35.5015C32.8188 35.3574 33.0596 34.8765 32.9155 34.4426L30.8334 28.4441L35.4153 26.8489C35.849 26.7048 36.0897 26.2238 35.9456 25.79L34.7831 22.4919L32.9153 23.5342Z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M14.0419 35.6007L24.9458 31.8099L19.2014 16.6866L10.9942 19.7838C10.5605 19.9279 10.3197 20.4089 10.4638 20.8427L13.4608 29.5974C13.6049 30.0311 14.0858 30.2719 14.5197 30.1278L17.8417 28.993L19.7065 35.0291C19.8506 35.4629 20.3316 35.7036 20.7653 35.5595L22.7708 34.8656L21.0396 30.1488L17.4659 31.4029L14.0419 35.6007Z"
                          fill="#34A853"
                        />
                        <path
                          d="M26.8757 25.33L24.3674 20.6159L18.1709 24.3456L20.6792 29.0597L26.8757 25.33Z"
                          fill="#4285F4"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Google Pay</div>
                    <div className="text-xs text-muted-foreground">
                      Pay with your Google Pay account
                    </div>
                  </div>
                </div>
                <div>
                  {selectedMethod === 'googlepay' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>

              {/* PhonePe Option */}
              <div
                className={`border p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedMethod === 'phonepay' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedMethod('phonepay')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative">
                    <div className="w-full h-full flex items-center justify-center bg-[#5f259f] rounded-full">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17.5585 9.71507C17.5585 13.1111 14.8181 15.8515 11.4221 15.8515C8.02607 15.8515 5.28564 13.1111 5.28564 9.71507C5.28564 6.31905 8.02607 3.57861 11.4221 3.57861C14.8181 3.57861 17.5585 6.31905 17.5585 9.71507Z"
                          fill="white"
                        />
                        <path
                          d="M11.4219 7.81085L9.17992 10.0528L11.4219 12.3263L13.6638 10.0528L11.4219 7.81085Z"
                          fill="#5F259F"
                        />
                        <path
                          d="M19.6421 16.7731L15.2368 12.3677C15.9098 11.2111 16.3162 9.84613 16.3162 8.4812C16.3162 4.85985 13.3668 1.91052 9.74551 1.91052C6.12417 1.91052 3.1748 4.85989 3.1748 8.4812C3.1748 12.1025 6.12413 15.0519 9.74547 15.0519C11.2059 15.0519 12.6636 14.5678 13.8421 13.772L18.0777 17.9861C18.2663 18.1747 18.5195 18.2691 18.7885 18.2691C19.0575 18.2691 19.3265 18.1747 19.5151 17.9861C19.8923 17.6089 19.8923 17.0344 19.6421 16.7731ZM9.74547 13.6982C6.84672 13.6982 4.52851 11.38 4.52851 8.4812C4.52851 5.58244 6.84672 3.26423 9.74547 3.26423C12.6442 3.26423 14.9625 5.58244 14.9625 8.4812C14.9625 11.38 12.6442 13.6982 9.74547 13.6982Z"
                          fill="white"
                        />
                        <path
                          d="M19.6421 19.6422L15.2368 15.2368C15.9098 14.0803 16.3162 12.7153 16.3162 11.3504C16.3162 7.72904 13.3668 4.77966 9.74551 4.77966C6.12417 4.77966 3.1748 7.72904 3.1748 11.3504C3.1748 14.9717 6.12413 17.9211 9.74547 17.9211C11.2059 17.9211 12.6636 17.437 13.8421 16.6412L18.0777 20.8553C18.2663 21.0439 18.5195 21.1383 18.7885 21.1383C19.0575 21.1383 19.3265 21.0439 19.5151 20.8553C19.8923 20.4781 19.8923 19.9036 19.6421 19.6422ZM9.74547 16.5674C6.84672 16.5674 4.52851 14.2491 4.52851 11.3504C4.52851 8.45162 6.84672 6.13337 9.74547 6.13337C12.6442 6.13337 14.9625 8.45158 14.9625 11.3504C14.9625 14.2492 12.6442 16.5674 9.74547 16.5674Z"
                          fill="#5F259F"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">PhonePe</div>
                    <div className="text-xs text-muted-foreground">
                      Pay using PhonePe wallet or UPI
                    </div>
                  </div>
                </div>
                <div>
                  {selectedMethod === 'phonepay' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>

              {/* UPI ID Option */}
              <div
                className={`border p-3 rounded-lg flex flex-col cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedMethod === 'upi' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedMethod('upi')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 relative">
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4Z"
                            stroke="#3F84F3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15.5 13.5L13 16.5L11 14.5L8 18"
                            stroke="#DE471C"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M18 9C18.5523 9 19 8.55228 19 8C19 7.44772 18.5523 7 18 7C17.4477 7 17 7.44772 17 8C17 8.55228 17.4477 9 18 9Z"
                            stroke="#79B43C"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">UPI</div>
                      <div className="text-xs text-muted-foreground">Pay using any UPI app</div>
                    </div>
                  </div>
                  <div>
                    {selectedMethod === 'upi' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                </div>

                {selectedMethod === 'upi' && (
                  <div className="mt-3 pl-12 pr-2">
                    <Label htmlFor="upi-id" className="text-xs mb-1 block">
                      Enter UPI ID
                    </Label>
                    <Input
                      id="upi-id"
                      placeholder="e.g. yourname@upi"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Razorpay Option */}
              <div
                className={`border p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedMethod === 'razorpay' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedMethod('razorpay')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative">
                    <Image
                      src="/razorpay-logo.svg"
                      alt="Razorpay"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <div className="font-medium">Razorpay (UPI/Card)</div>
                    <div className="text-xs text-muted-foreground">
                      Pay securely via UPI, card, or netbanking
                    </div>
                  </div>
                </div>
                <div>
                  {selectedMethod === 'razorpay' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            {/* If Razorpay selected, show PaymentButton */}
            {selectedMethod === 'razorpay' ? (
              <div className="flex flex-row gap-2 mt-4">
                <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="flex-1">
                  Cancel
                </Button>
                <PaymentButton
                  amount={paymentRequest.amount}
                  productId={paymentRequest.id}
                  onSuccess={response => {
                    setIsPaymentSuccessful(true);
                    setTransactionId(response.razorpay_payment_id || response.razorpay_order_id);
                    if (onPaymentComplete)
                      onPaymentComplete(response.razorpay_payment_id || response.razorpay_order_id, 'razorpay');
                  }}
                  onError={err => {
                    const error = err as PaymentError;
                    setError(error.message || error.description || 'Payment failed');
                  }}
                />
              </div>
            ) : (
              <Button
                onClick={() => processPayment(selectedMethod as PaymentMethod)}
                disabled={!selectedMethod || (selectedMethod === 'upi' && !upiId) || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    Pay ₹{paymentRequest.amount.toFixed(2)} <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </>
      ) : (
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h3 className="text-lg font-medium">Payment Successful!</h3>
              <p className="text-muted-foreground text-sm">
                Your payment of{' '}
                <span className="font-medium">₹{paymentRequest.amount.toFixed(2)}</span> was
                successfully processed
              </p>
            </div>

            <div className="bg-gray-50 rounded-md p-3 w-full mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-medium">{transactionId}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium capitalize">
                  {selectedMethod === 'googlepay'
                    ? 'Google Pay'
                    : selectedMethod === 'phonepay'
                      ? 'PhonePe'
                      : 'UPI'}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
            </div>

            <Button onClick={onCancel} className="mt-2">
              Done
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
