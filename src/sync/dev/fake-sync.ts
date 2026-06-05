"use client";

import type { RecordType } from "@/domain/models/investor-data";
import type { DecryptedRecord } from "@/sync/records/encrypted-records";

export const fakeUserDataKeyPromise = crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"],
);

const accountID = "11111111-1111-4111-8111-111111111111";
const instrumentID = "22222222-2222-4222-8222-222222222222";

function record(
  type: RecordType,
  id: string,
  payload: unknown,
  updatedAt = "2026-05-15T10:00:00.000Z",
): DecryptedRecord {
  return {
    id,
    deviceId: "fake-sync",
    updatedAt,
    deletedAt: null,
    envelope: {
      type,
      payloadVersion: 1,
      schemaVersion: 1,
      payload,
    },
  };
}

export function buildFakeSyncRecords(): DecryptedRecord[] {
  return [
    record("account", accountID, {
      recordType: "account",
      id: accountID,
      name: "Testowy portfel",
      baseCurrency: "PLN",
    }),
    record("asset", instrumentID, {
      recordType: "asset",
      id: instrumentID,
      kind: "stock",
      symbol: "AAPL",
      name: "Apple",
      currency: "USD",
    }),
    record("transaction", "33333333-3333-4333-8333-333333333333", {
      recordType: "transaction",
      id: "33333333-3333-4333-8333-333333333333",
      date: "2026-04-01T10:00:00.000Z",
      portfolioID: accountID,
      instrumentID: null,
      transactionType: "cashDeposit",
      quantity: null,
      price: null,
      grossAmount: 10_000,
      currency: "PLN",
      fees: 0,
      taxes: 0,
    }),
    record("transaction", "44444444-4444-4444-8444-444444444444", {
      recordType: "transaction",
      id: "44444444-4444-4444-8444-444444444444",
      date: "2026-04-02T10:00:00.000Z",
      portfolioID: accountID,
      instrumentID,
      transactionType: "buy",
      quantity: 5,
      price: 100,
      grossAmount: 500,
      currency: "USD",
      fees: 2,
      taxes: 0,
      fxRateToBase: 4,
    }),
    record("manualValuation", "55555555-5555-4555-8555-555555555555", {
      recordType: "manualValuation",
      id: "55555555-5555-4555-8555-555555555555",
      instrumentID,
      date: "2026-05-01T00:00:00.000Z",
      value: 120,
      currency: "USD",
    }),
    record("income", "66666666-6666-4666-8666-666666666666", {
      recordType: "income",
      id: "66666666-6666-4666-8666-666666666666",
      entryKind: "earning",
      year: 2026,
      month: 4,
      employmentType: "employment",
      enteredAmount: 8_900,
      currency: "PLN",
      fxRateToPLN: 1,
      plnAmount: 8_900,
      source: "Wynagrodzenie",
      burdenCategory: null,
      amountPLN: null,
      note: "fake sync",
    }),
    record("income", "77777777-7777-4777-8777-777777777777", {
      recordType: "income",
      id: "77777777-7777-4777-8777-777777777777",
      entryKind: "earning",
      year: 2026,
      month: 4,
      employmentType: "business",
      enteredAmount: 2_000,
      currency: "EUR",
      fxRateToPLN: 4.35,
      plnAmount: 8_700,
      source: "Faktura miesięczna",
      burdenCategory: null,
      amountPLN: null,
      note: "fake sync",
    }),
    record("income", "88888888-8888-4888-8888-888888888888", {
      recordType: "income",
      id: "88888888-8888-4888-8888-888888888888",
      entryKind: "burden",
      year: 2026,
      month: 4,
      employmentType: null,
      enteredAmount: null,
      currency: null,
      fxRateToPLN: null,
      plnAmount: null,
      source: null,
      burdenCategory: "zus",
      amountPLN: 1_830,
      note: "fake sync",
    }),
  ];
}

export function buildFakeManualValuationRecord(input: {
  instrumentID: string;
  date: string;
  value: number;
  currency: string;
}): DecryptedRecord {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  return record(
    "manualValuation",
    id,
    {
      recordType: "manualValuation",
      id,
      instrumentID: input.instrumentID,
      date: input.date,
      value: input.value,
      currency: input.currency,
    },
    now,
  );
}
