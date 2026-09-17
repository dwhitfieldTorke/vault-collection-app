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
  const prices: number[] = (data.itemSummaries ?? [])
    .map((item: { price?: { value?: string; currency?: string } }) =>
      item.price?.currency === "USD" ? Number(item.price.value) : null
    )
    .filter((p: number | null): p is number => p != null && !Number.isNaN(p))
    .sort((a: number, b: number) => a - b);

  if (prices.length === 0) return null;

  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

  return {
    low: prices[0],
    median: Math.round(median),
    high: prices[prices.length - 1],
    count: prices.length,
  };
}
