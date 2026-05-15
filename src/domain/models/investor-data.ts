export type RecordType =
  | "account"
  | "asset"
  | "transaction"
  | "manualValuation"
  | "income"
  | "settings";

export type ValuationPoint = {
  label: string;
  value: number;
};

export type AllocationSlice = {
  label: string;
  percent: number;
};

export type PortfolioSummary = {
  id: string;
  name: string;
  baseCurrency: string;
  value: number;
  dailyChange: number;
  positions: number;
};

export type InvestorDataSnapshot = {
  asOf: string;
  totalValue: number;
  monthlyChange: number;
  cash: number;
  portfolios: PortfolioSummary[];
  valuationSeries: ValuationPoint[];
  allocation: AllocationSlice[];
};
