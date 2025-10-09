// utils/price.ts

export async function fetchDotUsdPrice(): Promise<number> {
  try {
    const resp = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd"
    );
    if (!resp.ok) {
      throw new Error("Failed to fetch DOT price");
    }
    const data = await resp.json();
    // e.g. data = { polkadot: { usd: 4.25 } }
    const price = data.polkadot?.usd;
    if (typeof price !== "number") {
      throw new Error("Invalid price data");
    }
    return price;
  } catch (err) {
    console.error("fetchDotUsdPrice error:", err);
    return 0;
  }
}

// Given USD amount, return equivalent DOT
export function usdToDot(usd: number, dotUsdPrice: number): number {
  if (dotUsdPrice === 0) return 0;
  return usd / dotUsdPrice;
}

// Given DOT amount, return USD
export function dotToUsd(dot: number, dotUsdPrice: number): number {
  return dot * dotUsdPrice;
}
