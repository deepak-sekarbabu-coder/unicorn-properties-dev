import { getFirebaseAdminApp } from "@/lib/firebase-admin";
import { auth } from "firebase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, response: NextResponse) {
  const { idToken, expiresIn } = await request.json();

  const sessionCookie = await auth(getFirebaseAdminApp()).createSessionCookie(idToken, { expiresIn });

  cookies().set("session", sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: true,
  });

  return NextResponse.json({ status: "success" });
}

export async function DELETE(request: NextRequest) {
    cookies().delete("session");
    return NextResponse.json({ status: "success" });
}
