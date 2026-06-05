import { NextResponse, type NextRequest } from "next/server";
import {
  getCachedMarketData,
  setCachedMarketData,
} from "@/market-data/cache";
import {
  fetchNbpFxRate,
  fetchNbpMonthlyAverageFxRate,
} from "@/market-data/providers/nbp";
import type { FxRate } from "@/market-data/types";

const FX_CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const date = request.nextUrl.searchParams.get("date");
  const yearText = request.nextUrl.searchParams.get("year");
  const monthText = request.nextUrl.searchParams.get("month");

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }
  if ((yearText && !monthText) || (!yearText && monthText)) {
    return NextResponse.json({ error: "Year and month must be provided together." }, { status: 400 });
  }
  const year = yearText ? Number(yearText) : null;
  const month = monthText ? Number(monthText) : null;
  if (
    yearText &&
    (year == null ||
      month == null ||
      !Number.isInteger(year) ||
      year < 2001 ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12)
  ) {
    return NextResponse.json({ error: "Invalid FX month." }, { status: 400 });
  }

  const periodKey = year && month ? `${year}-${String(month).padStart(2, "0")}` : date ?? "latest";
  const cacheKey = `fx:nbp:${code.trim().toUpperCase()}:${periodKey}`;
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
    const rate =
      year && month
        ? await fetchNbpMonthlyAverageFxRate(code, year, month)
        : await fetchNbpFxRate(code, date);
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
