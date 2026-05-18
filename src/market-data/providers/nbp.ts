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
