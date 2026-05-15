import { describe, expect, it } from "vitest";
import type { RecordType } from "@/domain/models/investor-data";
import type { DecryptedRecord } from "@/sync/records/encrypted-records";
import { buildInvestorDataSnapshot } from "@/sync/records/investor-snapshot";

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
    deviceId: "test",
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

describe("InvestorDataSnapshot mapper", () => {
  it("builds dashboard values from decrypted sync records", () => {
    const snapshot = buildInvestorDataSnapshot([
      record("account", accountID, {
        recordType: "account",
        id: accountID,
        name: "Core ETF",
        accountType: "Własny",
        baseCurrency: "PLN",
        colorHex: "#7EA16B",
        targetAllocation: {},
      }),
      record("asset", instrumentID, {
        recordType: "asset",
        id: instrumentID,
        kind: "etf",
        symbol: "VWCE",
        name: "Vanguard FTSE All-World",
        currency: "PLN",
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
        quantity: 10,
        price: 100,
        grossAmount: 1_000,
        currency: "PLN",
        fees: 5,
        taxes: 0,
      }),
      record("manualValuation", "55555555-5555-4555-8555-555555555555", {
        recordType: "manualValuation",
        id: "55555555-5555-4555-8555-555555555555",
        instrumentID,
        date: "2026-05-01T10:00:00.000Z",
        value: 120,
        currency: "PLN",
      }),
    ]);

    expect(snapshot.totalValue).toBe(10_195);
    expect(snapshot.cash).toBe(8_995);
    expect(snapshot.portfolios).toEqual([
      {
        id: accountID,
        name: "Core ETF",
        baseCurrency: "PLN",
        value: 10_195,
        dailyChange: 0,
        positions: 1,
      },
    ]);
    expect(snapshot.allocation.map((slice) => slice.label)).toEqual([
      "Gotówka",
      "Akcje / ETF",
    ]);
    expect(snapshot.allocation[0]?.percent).toBeCloseTo(88.2295, 4);
    expect(snapshot.allocation[1]?.percent).toBeCloseTo(11.7705, 4);
    expect(snapshot.valuationSeries.at(-1)).toEqual({
      label: "maj",
      value: 10_195,
    });
  });

  it("supports Swift JSONEncoder numeric dates", () => {
    const snapshot = buildInvestorDataSnapshot([
      record("account", accountID, {
        recordType: "account",
        id: accountID,
        name: "Core ETF",
        accountType: "Własny",
        baseCurrency: "PLN",
        colorHex: "#7EA16B",
        targetAllocation: {},
      }),
      record("transaction", "66666666-6666-4666-8666-666666666666", {
        recordType: "transaction",
        id: "66666666-6666-4666-8666-666666666666",
        date: 736387200,
        portfolioID: accountID,
        instrumentID: null,
        transactionType: "cashDeposit",
        quantity: null,
        price: null,
        grossAmount: 500,
        currency: "PLN",
        fees: 0,
        taxes: 0,
      }),
    ]);

    expect(snapshot.asOf).toBe("2026-05-15T10:00:00.000Z");
    expect(snapshot.cash).toBe(500);
    expect(snapshot.totalValue).toBe(500);
  });
});
