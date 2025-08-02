import crypto from 'crypto';
import { getFirestore } from 'firebase-admin/firestore';

import { NextRequest, NextResponse } from 'next/server';

import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac('sha256', webhookSecret as string);
    hmac.update(body);
    const generatedSignature = hmac.digest('hex');
    if (generatedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    const event = JSON.parse(body);
    const db = getFirestore(getFirebaseAdminApp());
    switch (event.event) {
      case 'payment.captured':
        await db.collection('orders').doc(event.payload.payment.entity.order_id).update({
          status: 'captured',
          webhookProcessedAt: new Date(),
        });
        break;
      case 'payment.failed':
        await db.collection('orders').doc(event.payload.payment.entity.order_id).update({
          status: 'failed',
          webhookProcessedAt: new Date(),
        });
        break;
      default:
        console.log(`Unhandled event: ${event.event}`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
