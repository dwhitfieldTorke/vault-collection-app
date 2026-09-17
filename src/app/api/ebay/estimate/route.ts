import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { searchEbayPriceRange } from "@/lib/ebay";
import { ItemCategory, gradeOption, isRawGrade } from "@/types";

interface EstimateRequest {
  category: ItemCategory;
  title: string;
  edition: string;
  source: string;
  gradeKey: string;
}

function buildQuery(req: EstimateRequest): string {
  const grade = gradeOption(req.category, req.gradeKey);
  const gradeTerm = isRawGrade(req.gradeKey) ? "" : grade.label;

  switch (req.category) {
    case "comic":
      return [req.title, req.edition, gradeTerm].filter(Boolean).join(" ");
    case "trading_card":
      return [req.title, req.source, req.edition, gradeTerm].filter(Boolean).join(" ");
    case "video_game":
    case "lego":
      return [req.title, req.edition].filter(Boolean).join(" ");
  }
}

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json()) as EstimateRequest;
  const query = buildQuery(body);
  if (!query) {
    return NextResponse.json({ error: "Not enough details to search eBay." }, { status: 400 });
  }

  try {
    const range = await searchEbayPriceRange(query);
    if (!range) {
      return NextResponse.json(
        { error: `No eBay listings found for "${query}".` },
        { status: 404 }
      );
    }
    return NextResponse.json({ ...range, query });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "eBay lookup failed." },
      { status: 502 }
    );
  }
}
