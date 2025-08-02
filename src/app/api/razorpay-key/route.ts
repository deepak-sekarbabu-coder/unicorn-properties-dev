import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow authenticated users (add your auth logic here)
  // For now, just return the key for demonstration
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key) {
    return NextResponse.json({ message: 'Razorpay key not set' }, { status: 500 });
  }
  return NextResponse.json({ key });
}
