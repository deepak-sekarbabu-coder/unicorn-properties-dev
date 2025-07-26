import { getFirebaseAdminApp } from "@/lib/firebase-admin";
import { auth } from "firebase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const adminApp = getFirebaseAdminApp();
    const sessionCookie = await auth(adminApp).createSessionCookie(idToken, { expiresIn });

    cookies().set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error('Session cookie creation failed:', error);
    return NextResponse.json({ status: "error", message: "Failed to create session." }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
    cookies().delete("session");
    return NextResponse.json({ status: "success" });
}
