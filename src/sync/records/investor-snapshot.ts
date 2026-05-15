import { z } from "zod";
import type {
  AllocationSlice,
  InvestorDataSnapshot,
  PortfolioSummary,
} from "@/domain/models/investor-data";
import type { DecryptedRecord } from "@/sync/records/encrypted-records";

const APPLE_REFERENCE_DATE_UNIX_MS = Date.UTC(2001, 0, 1);
const EPSILON = 0.000001;

const swiftDateSchema = z.union([z.number(), z.string()]);

const accountPayloadSchema = z.object({
  recordType: z.literal("account"),
  id: z.string().uuid(),
  name: z.string(),
  baseCurrency: z.string().min(1),
});

const assetPayloadSchema = z.object({
  recordType: z.literal("asset"),
  id: z.string().uuid(),
  kind: z.string(),
  symbol: z.string(),
  name: z.string(),
  currency: z.string().min(1),
  category: z.string().nullable().optional(),
});

const transferLotSchema = z.object({
  acquisitionDate: swiftDateSchema,
  quantity: z.number(),
  unitCost: z.number(),
  currency: z.string(),
  fxRateToBase: z.number().nullable().optional(),
});

const transactionPayloadSchema = z.object({
  recordType: z.literal("transaction"),
  id: z.string().uuid(),
  date: swiftDateSchema,
  portfolioID: z.string().uuid(),
  instrumentID: z.string().uuid().nullable().optional(),
  transactionType: z.string(),
  quantity: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  grossAmount: z.number(),
  currency: z.string().min(1),
  fees: z.number(),
  taxes: z.number(),
  fxRateToBase: z.number().nullable().optional(),
  targetCurrency: z.string().nullable().optional(),
  targetGrossAmount: z.number().nullable().optional(),
  transferKind: z.string().nullable().optional(),
  transferLots: z.array(transferLotSchema).nullable().optional(),
});

const manualValuationPayloadSchema = z.object({
  recordType: z.literal("manualValuation"),
  id: z.string().uuid(),
  instrumentID: z.string().uuid(),
  date: swiftDateSchema,
  value: z.number(),
  currency: z.string().min(1),
});

const settingsPayloadSchema = z.object({
  recordType: z.literal("settings"),
  id: z.string().uuid().optional(),
  baseCurrency: z.string().min(1).optional(),
  updatedAt: swiftDateSchema.optional(),
});

type AccountPayload = z.infer<typeof accountPayloadSchema>;
type AssetPayload = z.infer<typeof assetPayloadSchema>;
type TransactionPayload = z.infer<typeof transactionPayloadSchema>;
type ManualValuationPayload = z.infer<typeof manualValuationPayloadSchema>;
type SettingsPayload = z.infer<typeof settingsPayloadSchema>;

type Ledger = {
  positions: Map<string, number>;
  cashBalances: Map<string, number>;
};

type ParsedDataset = {
  accounts: AccountPayload[];
  assets: AssetPayload[];
  transactions: TransactionPayload[];
  manualValuations: ManualValuationPayload[];
  settings: SettingsPayload[];
};

type PortfolioValuation = {
  totalValue: number;
  cashValue: number;
  positionCount: number;
  allocationValues: Map<string, number>;
};

export function buildInvestorDataSnapshot(
  records: DecryptedRecord[],
): InvestorDataSnapshot {
  const dataset = parseDataset(records);
  const baseCurrency = getBaseCurrency(dataset);
  const asOf = getAsOf(records, dataset);
  const accounts = getAccounts(dataset, baseCurrency);
  const portfolios = accounts.map((account) =>
    buildPortfolioSummary(account, dataset, asOf),
  );
  const totalValue = portfolios.reduce(
    (sum, portfolio) => sum + portfolio.value,
    0,
  );
  const cash = accounts.reduce((sum, account) => {
    const transactions = transactionsForPortfolio(dataset.transactions, account.id);
    const ledger = computeLedger(transactions, asOf);
    return sum + valueCash(ledger, dataset.transactions, asOf);
  }, 0);
  const valuationSeries = buildValuationSeries(accounts, dataset, asOf);
  const monthlyChange = calculateMonthlyChange(valuationSeries);

  return {
    asOf: asOf.toISOString(),
    totalValue,
    monthlyChange,
    cash,
    portfolios,
    valuationSeries,
    allocation: buildAllocation(accounts, dataset, asOf, totalValue),
  };
}

function parseDataset(records: DecryptedRecord[]): ParsedDataset {
  const dataset: ParsedDataset = {
    accounts: [],
    assets: [],
    transactions: [],
    manualValuations: [],
    settings: [],
  };

  for (const record of records) {
    if (record.deletedAt) {
      continue;
    }

    switch (record.envelope.type) {
      case "account":
        dataset.accounts.push(accountPayloadSchema.parse(record.envelope.payload));
        break;
      case "asset":
        dataset.assets.push(assetPayloadSchema.parse(record.envelope.payload));
        break;
      case "transaction":
        dataset.transactions.push(
          transactionPayloadSchema.parse(record.envelope.payload),
        );
        break;
      case "manualValuation":
        dataset.manualValuations.push(
          manualValuationPayloadSchema.parse(record.envelope.payload),
        );
        break;
      case "settings":
        dataset.settings.push(settingsPayloadSchema.parse(record.envelope.payload));
        break;
      case "income":
        break;
    }
  }

  dataset.transactions.sort(
    (left, right) =>
      toDate(left.date).getTime() - toDate(right.date).getTime(),
  );
  dataset.manualValuations.sort(
    (left, right) =>
      toDate(left.date).getTime() - toDate(right.date).getTime(),
  );

  return dataset;
}

function getBaseCurrency(dataset: ParsedDataset) {
  return (
    dataset.settings
      .filter((settings) => settings.baseCurrency)
      .sort(
        (left, right) =>
          toDate(left.updatedAt ?? 0).getTime() -
          toDate(right.updatedAt ?? 0).getTime(),
      )
      .at(-1)?.baseCurrency ??
    dataset.accounts[0]?.baseCurrency ??
    "PLN"
  );
}

function getAsOf(records: DecryptedRecord[], dataset: ParsedDataset) {
  const dates = [
    ...records.map((record) => new Date(record.updatedAt)),
    ...dataset.transactions.map((transaction) => toDate(transaction.date)),
    ...dataset.manualValuations.map((valuation) => toDate(valuation.date)),
  ].filter((date) => !Number.isNaN(date.getTime()));

  if (dates.length === 0) {
    return new Date();
  }

  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function getAccounts(dataset: ParsedDataset, baseCurrency: string) {
  if (dataset.accounts.length > 0) {
    return dataset.accounts;
  }

  return [
    {
      recordType: "account" as const,
      id: "00000000-0000-4000-8000-000000000000",
      name: "Portfel",
      baseCurrency,
    },
  ];
}

function buildPortfolioSummary(
  account: AccountPayload,
  dataset: ParsedDataset,
  asOf: Date,
): PortfolioSummary {
  const transactions = transactionsForPortfolio(dataset.transactions, account.id);
  const valuation = valuePortfolio(computeLedger(transactions, asOf), dataset, asOf);

  return {
    id: account.id,
    name: account.name,
    baseCurrency: account.baseCurrency,
    value: valuation.totalValue,
    dailyChange: 0,
    positions: valuation.positionCount,
  };
}

function transactionsForPortfolio(
  transactions: TransactionPayload[],
  portfolioID: string,
) {
  return transactions.filter(
    (transaction) => transaction.portfolioID === portfolioID,
  );
}

function computeLedger(transactions: TransactionPayload[], asOf: Date): Ledger {
  const ledger: Ledger = {
    positions: new Map(),
    cashBalances: new Map(),
  };

  for (const transaction of transactions) {
    if (toDate(transaction.date).getTime() > asOf.getTime()) {
      continue;
    }

    applyTransaction(ledger, transaction);
  }

  return ledger;
}

function applyTransaction(ledger: Ledger, transaction: TransactionPayload) {
  const type = transaction.transactionType;
  const grossAmount = transaction.grossAmount;
  const fees = transaction.fees;
  const taxes = transaction.taxes;
  const currency = transaction.currency;
  const fxRate = transaction.fxRateToBase;

  switch (type) {
    case "cashDeposit":
    case "transferIn":
      addCash(ledger, currency, grossAmount);
      break;
    case "accountTransferIn":
      if (transaction.transferKind === "asset") {
        addAssetTransfer(ledger, transaction);
      } else {
        addCash(ledger, currency, grossAmount);
      }
      break;
    case "cashWithdrawal":
    case "transferOut":
      addCash(ledger, currency, -grossAmount);
      break;
    case "buy":
      addCashForTrade(ledger, transaction, -(grossAmount + fees), fxRate);
      addPosition(ledger, transaction.instrumentID, transaction.quantity ?? 0);
      break;
    case "sell":
      addCashForTrade(ledger, transaction, grossAmount - fees - taxes, fxRate);
      addPosition(ledger, transaction.instrumentID, -(transaction.quantity ?? 0));
      break;
    case "dividend":
    case "interest":
    case "bondCoupon":
      addCash(ledger, currency, grossAmount - taxes);
      break;
    case "bondRedemption":
      addCash(ledger, currency, grossAmount - taxes);
      addPosition(ledger, transaction.instrumentID, -(transaction.quantity ?? 0));
      break;
    case "depositOpen":
      addCash(ledger, currency, -grossAmount);
      addPosition(ledger, transaction.instrumentID, 1);
      break;
    case "depositClose":
      addCash(ledger, currency, grossAmount - taxes);
      addPosition(ledger, transaction.instrumentID, -(transaction.quantity ?? 1));
      break;
    case "fee":
    case "tax":
      addCash(ledger, currency, -grossAmount);
      break;
    case "fxConversion":
      addCash(ledger, currency, -grossAmount);
      if (transaction.targetCurrency && transaction.targetGrossAmount) {
        addCash(
          ledger,
          transaction.targetCurrency,
          transaction.targetGrossAmount,
        );
      } else if (fxRate) {
        addCash(ledger, "PLN", grossAmount * fxRate);
      }
      break;
    case "correction":
      addCash(ledger, currency, grossAmount);
      break;
  }
}

function addAssetTransfer(ledger: Ledger, transaction: TransactionPayload) {
  const instrumentID = transaction.instrumentID;
  if (!instrumentID) {
    return;
  }

  const lots = transaction.transferLots ?? [];
  const quantity =
    lots.length > 0
      ? lots.reduce((sum, lot) => sum + lot.quantity, 0)
      : transaction.quantity ?? 0;

  addPosition(ledger, instrumentID, quantity);
}

function addCashForTrade(
  ledger: Ledger,
  transaction: TransactionPayload,
  amount: number,
  fxRate: number | null | undefined,
) {
  if (fxRate && transaction.currency !== "PLN") {
    addCash(ledger, "PLN", amount * fxRate);
    return;
  }

  addCash(ledger, transaction.currency, amount);
}

function addCash(ledger: Ledger, currency: string, amount: number) {
  ledger.cashBalances.set(currency, (ledger.cashBalances.get(currency) ?? 0) + amount);
}

function addPosition(
  ledger: Ledger,
  instrumentID: string | null | undefined,
  quantity: number,
) {
  if (!instrumentID || Math.abs(quantity) <= EPSILON) {
    return;
  }

  ledger.positions.set(
    instrumentID,
    (ledger.positions.get(instrumentID) ?? 0) + quantity,
  );
}

function valuePortfolio(
  ledger: Ledger,
  dataset: ParsedDataset,
  asOf: Date,
): PortfolioValuation {
  const assetsByID = new Map(dataset.assets.map((asset) => [asset.id, asset]));
  const allocationValues = new Map<string, number>();
  let holdingsValue = 0;
  let positionCount = 0;

  for (const [instrumentID, quantity] of ledger.positions) {
    if (quantity <= EPSILON) {
      continue;
    }

    const asset = assetsByID.get(instrumentID);
    const price = latestPriceForInstrument(instrumentID, dataset, asOf);
    const currency = asset?.currency ?? "PLN";
    const marketValue = quantity * price * fxRateForCurrency(currency, dataset, asOf);

    if (marketValue <= EPSILON) {
      continue;
    }

    holdingsValue += marketValue;
    positionCount += 1;
    const assetClass = assetClassLabel(asset?.kind);
    allocationValues.set(
      assetClass,
      (allocationValues.get(assetClass) ?? 0) + marketValue,
    );
  }

  const cashValue = valueCash(ledger, dataset.transactions, asOf);

  if (cashValue > EPSILON) {
    allocationValues.set(
      "Gotówka",
      (allocationValues.get("Gotówka") ?? 0) + cashValue,
    );
  }

  return {
    totalValue: holdingsValue + cashValue,
    cashValue,
    positionCount,
    allocationValues,
  };
}

function valueCash(
  ledger: Ledger,
  transactions: TransactionPayload[],
  asOf: Date,
) {
  let value = 0;

  for (const [currency, balance] of ledger.cashBalances) {
    value += balance * fxRateForCurrency(currency, { transactions } as ParsedDataset, asOf);
  }

  return value;
}

function latestPriceForInstrument(
  instrumentID: string,
  dataset: ParsedDataset,
  asOf: Date,
) {
  const manualPrice = dataset.manualValuations
    .filter(
      (valuation) =>
        valuation.instrumentID === instrumentID &&
        valuation.value > 0 &&
        toDate(valuation.date).getTime() <= asOf.getTime(),
    )
    .at(-1)?.value;

  if (manualPrice && manualPrice > 0) {
    return manualPrice;
  }

  return (
    dataset.transactions
      .filter(
        (transaction) =>
          transaction.instrumentID === instrumentID &&
          (transaction.price ?? 0) > 0 &&
          toDate(transaction.date).getTime() <= asOf.getTime(),
      )
      .at(-1)?.price ?? 0
  );
}

function fxRateForCurrency(
  currency: string,
  dataset: Pick<ParsedDataset, "transactions">,
  asOf: Date,
) {
  if (currency === "PLN") {
    return 1;
  }

  return (
    dataset.transactions
      .filter(
        (transaction) =>
          transaction.currency === currency &&
          (transaction.fxRateToBase ?? 0) > 0 &&
          toDate(transaction.date).getTime() <= asOf.getTime(),
      )
      .at(-1)?.fxRateToBase ?? 1
  );
}

function buildAllocation(
  accounts: AccountPayload[],
  dataset: ParsedDataset,
  asOf: Date,
  totalValue: number,
): AllocationSlice[] {
  if (totalValue <= EPSILON) {
    return [];
  }

  const values = new Map<string, number>();

  for (const account of accounts) {
    const ledger = computeLedger(
      transactionsForPortfolio(dataset.transactions, account.id),
      asOf,
    );
    const valuation = valuePortfolio(ledger, dataset, asOf);

    for (const [label, value] of valuation.allocationValues) {
      values.set(label, (values.get(label) ?? 0) + value);
    }
  }

  return [...values.entries()]
    .filter(([, value]) => value > EPSILON)
    .sort(([, left], [, right]) => right - left)
    .map(([label, value]) => ({
      label,
      percent: (value / totalValue) * 100,
    }));
}

function buildValuationSeries(
  accounts: AccountPayload[],
  dataset: ParsedDataset,
  asOf: Date,
) {
  const sampleDates = lastMonthEndDates(asOf, 7);

  return sampleDates.map((date) => {
    const value = accounts.reduce((sum, account) => {
      const ledger = computeLedger(
        transactionsForPortfolio(dataset.transactions, account.id),
        date,
      );
      return sum + valuePortfolio(ledger, dataset, date).totalValue;
    }, 0);

    return {
      label: monthLabel(date),
      value,
    };
  });
}

function lastMonthEndDates(asOf: Date, count: number) {
  const dates: Date[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date =
      offset === 0
        ? asOf
        : new Date(
            Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - offset + 1, 0),
          );
    dates.push(date);
  }

  return dates;
}

function calculateMonthlyChange(
  valuationSeries: InvestorDataSnapshot["valuationSeries"],
) {
  const previous = valuationSeries.at(-2)?.value ?? 0;
  const current = valuationSeries.at(-1)?.value ?? 0;

  if (previous <= EPSILON) {
    return 0;
  }

  return ((current - previous) / previous) * 100;
}

function assetClassLabel(kind: string | undefined) {
  switch (kind) {
    case "stock":
    case "etf":
      return "Akcje / ETF";
    case "treasuryBond":
    case "listedBond":
      return "Obligacje";
    case "crypto":
      return "Kryptowaluty";
    case "deposit":
      return "Lokaty";
    case "cash":
      return "Gotówka";
    default:
      return "Inne aktywa";
  }
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("pl-PL", { month: "short" }).format(date);
}

function toDate(value: z.infer<typeof swiftDateSchema>) {
  if (typeof value === "number") {
    return new Date(APPLE_REFERENCE_DATE_UNIX_MS + value * 1000);
  }

  return new Date(value);
}
