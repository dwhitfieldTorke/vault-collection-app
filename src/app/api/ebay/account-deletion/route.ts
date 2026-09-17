import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// eBay's required compliance webhook: every app registered with eBay must
// have an endpoint that (a) answers eBay's verification handshake and
// (b) accepts notifications when a marketplace user deletes their account,
// so the app can remove any data it holds about that user.
//
// This app never stores eBay account data — the Browse API is used only for
// application-level price lookups (client_credentials), with no eBay user
// login or PII retained — so the POST handler has nothing to delete. It
// still must acknowledge receipt, which is what eBay's compliance check
// requires.

const ENDPOINT = process.env.EBAY_ACCOUNT_DELETION_ENDPOINT ?? "";
const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN ?? "";

export async function GET(request: NextRequest) {
  const challengeCode = request.nextUrl.searchParams.get("challenge_code");
  if (!challengeCode) {
    return NextResponse.json({ error: "Missing challenge_code" }, { status: 400 });
  }

  const hash = createHash("sha256");
  hash.update(challengeCode);
  hash.update(VERIFICATION_TOKEN);
  hash.update(ENDPOINT);

  return NextResponse.json({ challengeResponse: hash.digest("hex") });
}

export async function POST(request: NextRequest) {
  await request.json().catch(() => null);
  return new NextResponse(null, { status: 200 });
}
