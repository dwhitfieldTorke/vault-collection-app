import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

// firebase-admin needs Node.js APIs (fs, net, gRPC) that aren't available in
// the constrained runtime the proxy executes in on Vercel — so it can't be
// imported directly here. Instead we call a real API route (which always
// gets a full Node.js runtime) to do the actual verification.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("session")?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const verifyRes = await fetch(new URL("/api/auth/verify", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionCookie }),
    });

    if (!verifyRes.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
