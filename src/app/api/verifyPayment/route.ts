import crypto from 'crypto';
import { getFirestore } from 'firebase-admin/firestore';

import { NextRequest, NextResponse } from 'next/server';

import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } =
      await request.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');
    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    const db = getFirestore(getFirebaseAdminApp());
    const orderRef = db.collection('orders').doc(razorpay_order_id);
    await orderRef.update({
      status: 'paid',
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paidAt: new Date(),
    });
    if (userId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        await userRef.update({
          lastPayment: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paidAt: new Date(),
          },
        });
      } else {
        await userRef.set(
          {
            lastPayment: {
              orderId: razorpay_order_id,
              paymentId: razorpay_payment_id,
              paidAt: new Date(),
            },
          },
          { merge: true }
        );
      }
    }
    return NextResponse.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
