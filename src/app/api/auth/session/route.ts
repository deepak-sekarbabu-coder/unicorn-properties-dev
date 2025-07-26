import { getFirebaseAdminApp } from "@/lib/firebase-admin";
import { auth } from "firebase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
        return NextResponse.json({ status: "error", message: "idToken is required" }, { status: 400 });
    }
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const adminApp = getFirebaseAdminApp();
    if (!adminApp) {
        console.error("Firebase Admin SDK is not initialized.");
        return NextResponse.json({ status: "error", message: "Firebase Admin SDK not initialized on server." }, { status: 500 });
    }
    const sessionCookie = await auth(adminApp).createSessionCookie(idToken, { expiresIn });

    cookies().set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error('Session cookie creation failed:', error);
    // Ensure a helpful message is returned
    const errorMessage = error.message || "Failed to create session.";
    return NextResponse.json({ status: "error", message: errorMessage }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
    try {
        cookies().delete("session");
        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error('Session cookie deletion failed:', error);
        return NextResponse.json({ status: "error", message: "Failed to delete session." }, { status: 500 });
    }
}
