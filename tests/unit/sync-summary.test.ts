import { describe, expect, it } from "vitest";
import type { DecryptedRecord } from "@/sync/records/encrypted-records";
import { summarizeDecryptedRecords } from "@/sync/records/sync-summary";

describe("sync record summary", () => {
  it("counts decrypted records by Swift record type", () => {
    const records: DecryptedRecord[] = [
      {
        id: "account-1",
        deviceId: "ios",
        updatedAt: "2026-05-14T10:00:00.000Z",
        deletedAt: null,
        envelope: {
          type: "account",
          payloadVersion: 1,
          schemaVersion: 1,
          payload: {},
        },
      },
      {
        id: "transaction-1",
        deviceId: "ios",
        updatedAt: "2026-05-15T10:00:00.000Z",
        deletedAt: null,
        envelope: {
          type: "transaction",
          payloadVersion: 1,
          schemaVersion: 1,
          payload: {},
        },
      },
      {
        id: "transaction-2",
        deviceId: null,
        updatedAt: "2026-05-13T10:00:00.000Z",
        deletedAt: null,
        envelope: {
          type: "transaction",
          payloadVersion: 1,
          schemaVersion: 1,
          payload: {},
        },
      },
    ];

    const summary = summarizeDecryptedRecords(records);

    expect(summary.totalRecords).toBe(3);
    expect(summary.latestUpdatedAt).toBe("2026-05-15T10:00:00.000Z");
    expect(summary.byType.account).toBe(1);
    expect(summary.byType.transaction).toBe(2);
    expect(summary.byType.asset).toBe(0);
  });
});
