import type { InvestorDataSnapshot } from "@/domain/models/investor-data";

export const sampleSnapshot: InvestorDataSnapshot = {
  asOf: "2026-05-15T10:00:00.000Z",
  totalValue: 428_940,
  monthlyChange: 3.8,
  cash: 38_600,
  portfolios: [
    {
      id: "core",
      name: "Core ETF",
      baseCurrency: "PLN",
      value: 244_300,
      dailyChange: 0.7,
      positions: 8,
    },
    {
      id: "growth",
      name: "Growth",
      baseCurrency: "PLN",
      value: 132_840,
      dailyChange: -0.4,
      positions: 11,
    },
    {
      id: "cash",
      name: "Gotówka i obligacje",
      baseCurrency: "PLN",
      value: 51_800,
      dailyChange: 0.1,
      positions: 4,
    },
  ],
  valuationSeries: [
    { label: "Lis", value: 386_100 },
    { label: "Gru", value: 392_400 },
    { label: "Sty", value: 401_700 },
    { label: "Lut", value: 398_500 },
    { label: "Mar", value: 414_900 },
    { label: "Kwi", value: 421_300 },
    { label: "Maj", value: 428_940 },
  ],
  allocation: [
    { label: "ETF", percent: 52 },
    { label: "Akcje", percent: 24 },
    { label: "Gotówka", percent: 9 },
    { label: "Obligacje", percent: 10 },
    { label: "Inne", percent: 5 },
  ],
};
