'use client';

import { format } from 'date-fns';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, CreditCard, Info, X } from 'lucide-react';

import { useState } from 'react';

import { db } from '@/lib/firebase';

import { PaymentGateways } from '@/components/payment-gateways';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast-provider';

interface PaymentRequestCardProps {
  id: string;
  fromApartmentName: string;
  amount: number;
  description: string;
  createdAt: string;
  dueDate?: string;
  status?: 'pending' | 'paid' | 'failed';
  onPaymentComplete?: () => void;
  onDismiss?: () => void;
}

export function PaymentRequestCard({
  id,
  fromApartmentName,
  amount,
  description,
  createdAt,
  dueDate,
  status = 'pending',
  onPaymentComplete,
  onDismiss,
}: PaymentRequestCardProps) {
  const toast = useToast();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const markAsRead = async () => {
    try {
      const notificationRef = doc(db, 'notifications', id);
      const notificationSnap = await getDoc(notificationRef);
      if (notificationSnap.exists()) {
        await updateDoc(notificationRef, { isRead: true });
      } else {
        // For demo, create the doc if missing
        await setDoc(notificationRef, { isRead: true });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async () => {
    setIsProcessing(true);
    try {
      const notificationRef = doc(db, 'notifications', id);
      const notificationSnap = await getDoc(notificationRef);
      if (notificationSnap.exists()) {
        await updateDoc(notificationRef, { isRead: true, isDismissed: true });
      } else {
        // For demo, create the doc if missing
        await setDoc(notificationRef, { isRead: true, isDismissed: true });
      }
      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Error', {
        description: 'Failed to dismiss notification. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = async (transactionId: string) => {
    // Close the payment dialog
    setIsPaymentOpen(false);

    // Notify parent component
    if (onPaymentComplete) {
      onPaymentComplete();
    }

    // Show success toast
    toast.success('Payment Successful', {
      description: `Your payment of ₹${amount.toFixed(2)} has been processed. Transaction ID: ${transactionId}`,
    });
  };

  // Format dates
  const formattedCreatedAt = format(new Date(createdAt), 'yyyy-MM-dd');
  const formattedDueDate = dueDate ? format(new Date(dueDate), 'MMM d, yyyy') : undefined;

  return (
    <>
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {status === 'paid' ? (
                  <div className="rounded-full bg-green-100 p-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="rounded-full bg-blue-100 p-1">
                    <Info className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <h4 className="font-medium">Payment Request from {fromApartmentName}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  Requested on {formattedCreatedAt}
                  {formattedDueDate && (
                    <span>
                      {' '}
                      · Due by{' '}
                      <span className="text-amber-600 font-medium">{formattedDueDate}</span>
                    </span>
                  )}
                </div>
                <div className="font-medium">₹{amount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t bg-gray-50 p-2">
          <Button variant="ghost" size="sm" onClick={dismissNotification} disabled={isProcessing}>
            <X className="mr-1 h-4 w-4" /> Dismiss
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              markAsRead();
              setIsPaymentOpen(true);
            }}
            disabled={status === 'paid' || isProcessing}
          >
            <CreditCard className="mr-1 h-4 w-4" />
            {status === 'paid' ? 'Paid' : 'Pay Now'}
          </Button>
        </CardFooter>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Complete Payment</DialogTitle>
          <PaymentGateways
            paymentRequest={{
              id,
              amount,
              description,
              fromApartmentId: '', // These would be filled in a real implementation
              fromApartmentName: '',
              toApartmentId: '',
              toApartmentName: fromApartmentName,
              dueDate,
              status: 'pending',
            }}
            onPaymentComplete={handlePaymentComplete}
            onCancel={() => setIsPaymentOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
