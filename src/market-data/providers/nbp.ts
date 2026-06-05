import { z } from "zod";
import type { FxRate } from "@/market-data/types";

const nbpRateSchema = z.object({
  table: z.string(),
  code: z.string(),
  rates: z
    .array(
      z.object({
        effectiveDate: z.string(),
        mid: z.number(),
      }),
    )
    .min(1),
});

export async function fetchNbpFxRate(
  code: string,
  date?: string | null,
): Promise<FxRate> {
  const normalizedCode = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalizedCode)) {
    throw new Error("Currency code must use ISO 4217 format.");
  }

  if (normalizedCode === "PLN") {
    return {
      provider: "nbp",
      base: "PLN",
      quote: "PLN",
      rate: 1,
      effectiveDate: date ?? new Date().toISOString().slice(0, 10),
      table: "A",
    };
  }

  const datePath = date ? `/${date}` : "";
  const url = `https://api.nbp.pl/api/exchangerates/rates/a/${normalizedCode}${datePath}/?format=json`;
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`NBP returned ${response.status} for ${normalizedCode}.`);
  }

  const parsed = nbpRateSchema.parse(await response.json());
  const rate = parsed.rates[0];

  return {
    provider: "nbp",
    base: parsed.code,
    quote: "PLN",
    rate: rate.mid,
    effectiveDate: rate.effectiveDate,
    table: parsed.table,
  };
}

export async function fetchNbpMonthlyAverageFxRate(
  code: string,
  year: number,
  month: number,
): Promise<FxRate> {
  const normalizedCode = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalizedCode)) {
    throw new Error("Currency code must use ISO 4217 format.");
  }
  if (!Number.isInteger(year) || year < 2001 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid FX month.");
  }

  const monthText = String(month).padStart(2, "0");
  const start = `${year}-${monthText}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  const end = endDate.toISOString().slice(0, 10);

  if (normalizedCode === "PLN") {
    return {
      provider: "nbp",
      base: "PLN",
      quote: "PLN",
      rate: 1,
      effectiveDate: `${year}-${monthText}`,
      table: "A",
    };
  }

  const url = `https://api.nbp.pl/api/exchangerates/rates/a/${normalizedCode}/${start}/${end}/?format=json`;
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`NBP returned ${response.status} for ${normalizedCode}.`);
  }

  const parsed = nbpRateSchema.parse(await response.json());
  const total = parsed.rates.reduce((sum, item) => sum + item.mid, 0);

  return {
    provider: "nbp",
    base: parsed.code,
    quote: "PLN",
    rate: total / parsed.rates.length,
    effectiveDate: `${year}-${monthText}`,
    table: parsed.table,
  };
}
