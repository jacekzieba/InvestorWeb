import { z } from "zod";
import type { DecryptedRecord } from "@/sync/records/encrypted-records";
import type { WriteRecordPayload } from "@/sync/records/record-writer";

const APPLE_REFERENCE_DATE_UNIX_MS = Date.UTC(2001, 0, 1);

const TRANSACTION_TYPES = new Set([
  "buy",
  "sell",
  "cashDeposit",
  "cashWithdrawal",
  "dividend",
  "interest",
  "bondCoupon",
  "bondRedemption",
  "depositOpen",
  "depositClose",
  "fee",
  "tax",
  "fxConversion",
  "transferIn",
  "transferOut",
  "accountTransferIn",
  "correction",
]);

const TYPES_REQUIRING_INSTRUMENT = new Set([
  "buy",
  "sell",
  "dividend",
  "bondCoupon",
  "bondRedemption",
  "depositOpen",
  "depositClose",
  "transferIn",
  "transferOut",
  "accountTransferIn",
]);

const TYPES_USING_QUANTITY = new Set([
  "buy",
  "sell",
  "bondRedemption",
  "transferIn",
  "transferOut",
  "accountTransferIn",
]);

const headerAliases: Record<string, string> = {
  account: "portfolio",
  accountid: "portfolio",
  amount: "grossamount",
  brutto: "grossamount",
  currencycode: "currency",
  data: "date",
  fee: "fees",
  gross: "grossamount",
  grossamount: "grossamount",
  id: "id",
  instrument: "instrument",
  instrumentid: "instrument",
  isin: "instrument",
  kwota: "grossamount",
  oplaty: "fees",
  portfolio: "portfolio",
  portfolioid: "portfolio",
  portfel: "portfolio",
  price: "price",
  prowizja: "fees",
  quantity: "quantity",
  symbol: "instrument",
  tax: "taxes",
  taxes: "taxes",
  ticker: "instrument",
  transactiontype: "transactiontype",
  type: "transactiontype",
  typ: "transactiontype",
  waluta: "currency",
};

export type ImportReferenceData = {
  portfolios: { id: string; name: string }[];
  instruments: { id: string; symbol: string; name: string }[];
  existingTransactionIds: Set<string>;
};

export type TransactionImportRow = {
  rowNumber: number;
  values: Record<string, string>;
  payload: WriteRecordPayload | null;
  errors: string[];
  warnings: string[];
};

export type TransactionImportPreview = {
  rows: TransactionImportRow[];
  validRows: TransactionImportRow[];
  errorRows: TransactionImportRow[];
};

const transactionPayloadSchema = z.object({
  id: z.string().uuid(),
  recordType: z.literal("transaction"),
  date: z.number(),
  portfolioID: z.string().uuid(),
  instrumentID: z.string().uuid().optional(),
  transactionType: z.string(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  grossAmount: z.number(),
  currency: z.string().min(1),
  fees: z.number(),
  taxes: z.number(),
});

export function buildImportReferenceData(
  records: DecryptedRecord[] | null,
): ImportReferenceData {
  const portfolios = new Map<string, { id: string; name: string }>();
  const instruments = new Map<string, { id: string; symbol: string; name: string }>();
  const existingTransactionIds = new Set<string>();

  for (const record of records ?? []) {
    if (record.deletedAt) continue;

    if (record.envelope.type === "account") {
      const payload = record.envelope.payload as { id?: string; name?: string };
      if (payload.id && payload.name) {
        portfolios.set(payload.id, { id: payload.id, name: payload.name });
      }
    }

    if (record.envelope.type === "asset") {
      const payload = record.envelope.payload as {
        id?: string;
        symbol?: string;
        name?: string;
      };
      if (payload.id && payload.symbol && payload.name) {
        instruments.set(payload.id, {
          id: payload.id,
          symbol: payload.symbol,
          name: payload.name,
        });
      }
    }

    if (record.envelope.type === "transaction") {
      existingTransactionIds.add(record.id);
    }
  }

  return {
    portfolios: [...portfolios.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "pl"),
    ),
    instruments: [...instruments.values()].sort((a, b) =>
      a.symbol.localeCompare(b.symbol, "pl"),
    ),
    existingTransactionIds,
  };
}

export function parseTransactionCsvImport(
  text: string,
  references: ImportReferenceData,
): TransactionImportPreview {
  return parseTransactionTable(parseCsvTable(text), references);
}

export function parseTransactionTable(
  table: unknown[][],
  references: ImportReferenceData,
): TransactionImportPreview {
  if (table.length === 0) {
    return { rows: [], validRows: [], errorRows: [] };
  }

  const headers = table[0].map((header) => normalizeHeader(String(header ?? "")));
  const seenImportedIds = new Set<string>();
  const rows = table
    .slice(1)
    .map((cells, index) =>
      parseTransactionRow(
        cells.map((cell) => String(cell ?? "")),
        headers,
        index + 2,
        references,
        seenImportedIds,
      ),
    )
    .filter((row) => Object.values(row.values).some(Boolean));

  return {
    rows,
    validRows: rows.filter((row) => row.payload && row.errors.length === 0),
    errorRows: rows.filter((row) => row.errors.length > 0),
  };
}

export function transactionCsvTemplate() {
  return [
    "date,portfolio,instrument,transactionType,quantity,price,grossAmount,currency,fees,taxes",
    "2026-05-17,Main Portfolio,AAPL,buy,2,190.50,381,USD,0,0",
    "2026-05-18,Main Portfolio,,cashDeposit,,,1000,PLN,0,0",
  ].join("\n");
}

function parseTransactionRow(
  cells: string[],
  headers: string[],
  rowNumber: number,
  references: ImportReferenceData,
  seenImportedIds: Set<string>,
): TransactionImportRow {
  const values = Object.fromEntries(
    headers.map((header, index) => [header, cells[index]?.trim() ?? ""]),
  );
  const errors: string[] = [];
  const warnings: string[] = [];
  const id = values.id || crypto.randomUUID();
  const transactionType = values.transactiontype ?? "";
  const date = parseDateToSwiftSeconds(values.date ?? "");
  const portfolioID = resolvePortfolio(values.portfolio ?? "", references);
  const instrumentID = resolveInstrument(values.instrument ?? "", references);
  const quantity = parseOptionalNumber(values.quantity ?? "");
  const price = parseOptionalNumber(values.price ?? "");
  const grossAmount = parseRequiredNumber(values.grossamount ?? "");
  const fees = parseOptionalNumber(values.fees ?? "") ?? 0;
  const taxes = parseOptionalNumber(values.taxes ?? "") ?? 0;
  const currency = (values.currency ?? "").toUpperCase();

  if (!values.date || date == null) errors.push("Nieprawidłowa data.");
  if (!values.portfolio || !portfolioID) errors.push("Nie znaleziono portfela.");
  if (!TRANSACTION_TYPES.has(transactionType)) errors.push("Nieznany typ transakcji.");
  if (grossAmount == null) errors.push("Brak poprawnej kwoty brutto.");
  if (!currency) errors.push("Brak waluty.");
  if (values.id && references.existingTransactionIds.has(values.id)) {
    errors.push("Transakcja o tym ID już istnieje.");
  }
  if (values.id && seenImportedIds.has(values.id)) {
    errors.push("Duplikat ID w importowanym pliku.");
  }
  if (values.id) {
    seenImportedIds.add(values.id);
  }
  if (values.instrument && !instrumentID) {
    errors.push("Nie znaleziono instrumentu.");
  }
  if (TYPES_REQUIRING_INSTRUMENT.has(transactionType) && !instrumentID) {
    errors.push("Ten typ transakcji wymaga instrumentu.");
  }
  if (TYPES_USING_QUANTITY.has(transactionType) && quantity == null) {
    errors.push("Ten typ transakcji wymaga ilości.");
  }
  if (values.quantity && quantity == null) errors.push("Nieprawidłowa ilość.");
  if (values.price && price == null) errors.push("Nieprawidłowa cena.");
  if (values.fees && fees == null) errors.push("Nieprawidłowe opłaty.");
  if (values.taxes && taxes == null) errors.push("Nieprawidłowy podatek.");
  if (price == null && TYPES_USING_QUANTITY.has(transactionType)) {
    warnings.push("Brak ceny. Transakcja zostanie zapisana bez ceny jednostkowej.");
  }

  const payload =
    errors.length === 0
      ? transactionPayloadSchema.parse({
          id,
          recordType: "transaction",
          date,
          portfolioID,
          ...(instrumentID ? { instrumentID } : {}),
          transactionType,
          ...(quantity != null ? { quantity } : {}),
          ...(price != null ? { price } : {}),
          grossAmount,
          currency,
          fees,
          taxes,
        })
      : null;

  return { rowNumber, values, payload, errors, warnings };
}

function parseCsvTable(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (quoted && next === "\"") {
        value += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);

  return rows;
}

function detectDelimiter(text: string) {
  const headerLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t"] as const;
  return candidates
    .map((delimiter) => ({
      delimiter,
      count: headerLine.split(delimiter).length - 1,
    }))
    .sort((left, right) => right.count - left.count)[0].delimiter;
}

function normalizeHeader(header: string) {
  const compact = header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  return headerAliases[compact] ?? compact;
}

function parseDateToSwiftSeconds(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const dotted = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(trimmed);
  const date = iso
    ? new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])))
    : dotted
      ? new Date(Date.UTC(Number(dotted[3]), Number(dotted[2]) - 1, Number(dotted[1])))
      : new Date(trimmed);

  if (Number.isNaN(date.getTime())) return null;
  return (date.getTime() - APPLE_REFERENCE_DATE_UNIX_MS) / 1000;
}

function parseRequiredNumber(value: string) {
  return parseOptionalNumber(value);
}

function parseOptionalNumber(value: string) {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/,(?=\d{1,6}$)/, ".");

  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolvePortfolio(value: string, references: ImportReferenceData) {
  const key = normalizeLookup(value);
  if (!key) return null;

  return (
    references.portfolios.find(
      (portfolio) =>
        normalizeLookup(portfolio.id) === key ||
        normalizeLookup(portfolio.name) === key,
    )?.id ?? null
  );
}

function resolveInstrument(value: string, references: ImportReferenceData) {
  const key = normalizeLookup(value);
  if (!key) return null;

  return (
    references.instruments.find(
      (instrument) =>
        normalizeLookup(instrument.id) === key ||
        normalizeLookup(instrument.symbol) === key ||
        normalizeLookup(instrument.name) === key,
    )?.id ?? null
  );
}

function normalizeLookup(value: string) {
  return value.trim().toLowerCase();
}
