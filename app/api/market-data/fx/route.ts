import { NextResponse, type NextRequest } from "next/server";
import {
  getCachedMarketData,
  setCachedMarketData,
} from "@/market-data/cache";
import { fetchNbpFxRate } from "@/market-data/providers/nbp";
import type { FxRate } from "@/market-data/types";

const FX_CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const date = request.nextUrl.searchParams.get("date");

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }

  const cacheKey = `fx:nbp:${code.trim().toUpperCase()}:${date ?? "latest"}`;
  const cached = getCachedMarketData<FxRate>(cacheKey);
  if (cached) {
    return NextResponse.json({
      data: cached.value,
      cache: {
        hit: true,
        fetchedAt: cached.fetchedAt,
        expiresAt: cached.expiresAt,
      },
    });
  }

  try {
    const rate = await fetchNbpFxRate(code, date);
    const entry = setCachedMarketData(cacheKey, rate, FX_CACHE_TTL_MS);
    return NextResponse.json({
      data: entry.value,
      cache: {
        hit: false,
        fetchedAt: entry.fetchedAt,
        expiresAt: entry.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Market data error." },
      { status: 502 },
    );
  }
}
