const IS_SANDBOX = process.env.EBAY_ENVIRONMENT !== "production";
const AUTH_HOST = IS_SANDBOX ? "api.sandbox.ebay.com" : "api.ebay.com";
const API_HOST = IS_SANDBOX ? "api.sandbox.ebay.com" : "api.ebay.com";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("eBay API credentials are not configured.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`https://${AUTH_HOST}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  });

  if (!res.ok) {
    throw new Error(`eBay auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

export interface EbayPriceRange {
  low: number;
  median: number;
  high: number;
  count: number;
  gradedCount: number;
  ungradedCount: number;
  gradedMedian: number | null;
  ungradedMedian: number | null;
}

// Third-party grading services whose name shows up in a listing title when
// an item has been professionally graded (comics, cards, and video games).
const GRADING_KEYWORDS = ["CGC", "PSA", "BGS", "SGC", "WATA", "VGA"];

function isGradedTitle(title: string): boolean {
  const upper = title.toUpperCase();
  return GRADING_KEYWORDS.some((keyword) => upper.includes(keyword));
}

function median(sortedPrices: number[]): number | null {
  if (sortedPrices.length === 0) return null;
  const mid = Math.floor(sortedPrices.length / 2);
  const value =
    sortedPrices.length % 2 === 0
      ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
      : sortedPrices[mid];
  return Math.round(value);
}

export async function searchEbayPriceRange(query: string): Promise<EbayPriceRange | null> {
  const token = await getAccessToken();

  const url = new URL(`https://${API_HOST}/buy/browse/v1/item_summary/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "50");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
  });

  if (!res.ok) {
    throw new Error(`eBay search failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const items: { price?: { value?: string; currency?: string }; title?: string }[] =
    data.itemSummaries ?? [];

  const priced = items
    .map((item) => ({
      price: item.price?.currency === "USD" ? Number(item.price.value) : null,
      graded: isGradedTitle(item.title ?? ""),
    }))
    .filter((item): item is { price: number; graded: boolean } => item.price != null && !Number.isNaN(item.price));

  if (priced.length === 0) return null;

  const prices = priced.map((p) => p.price).sort((a, b) => a - b);
  const gradedPrices = priced.filter((p) => p.graded).map((p) => p.price).sort((a, b) => a - b);
  const ungradedPrices = priced.filter((p) => !p.graded).map((p) => p.price).sort((a, b) => a - b);

  return {
    low: prices[0],
    median: median(prices) as number,
    high: prices[prices.length - 1],
    count: prices.length,
    gradedCount: gradedPrices.length,
    ungradedCount: ungradedPrices.length,
    gradedMedian: median(gradedPrices),
    ungradedMedian: median(ungradedPrices),
  };
}
