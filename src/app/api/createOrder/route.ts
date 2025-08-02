import { getFirestore } from 'firebase-admin/firestore';
import Razorpay from 'razorpay';

import { NextRequest, NextResponse } from 'next/server';

import { getFirebaseAdminApp } from '@/lib/firebase-admin';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, userId, productId } = await request.json();
    if (!amount || !userId) {
      return NextResponse.json({ message: 'Amount and userId are required' }, { status: 400 });
    }
    const options = {
      amount: amount * 100,
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    const db = getFirestore(getFirebaseAdminApp());
    const orderData = {
      orderId: order.id,
      razorpayOrderId: order.id,
      amount,
      currency: currency || 'INR',
      userId,
      productId: productId || null,
      status: 'created',
      createdAt: new Date(),
    };
    await db.collection('orders').doc(order.id).set(orderData);
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ message: 'Failed to create order', error }, { status: 500 });
  }
}
