import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { sessionCookie } = await request.json();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ uid: decoded.uid });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
