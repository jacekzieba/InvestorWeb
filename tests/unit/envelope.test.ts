import { describe, expect, it } from "vitest";
import { parsePayloadEnvelope } from "@/sync/envelopes/envelope";

describe("payload envelope", () => {
  it("accepts a versioned transaction envelope", () => {
    const envelope = parsePayloadEnvelope({
      type: "transaction",
      payloadVersion: 1,
      schemaVersion: 1,
      payload: {
        id: "b8805a78-b5a5-4fe7-a83f-716117184d25",
        portfolioID: "1a3e2e4f-c9f1-45ab-a67d-a9ef0351b5a7",
      },
    });

    expect(envelope.type).toBe("transaction");
  });

  it("rejects an unsupported record type", () => {
    expect(() =>
      parsePayloadEnvelope({
        type: "watchlist",
        payloadVersion: 1,
        schemaVersion: 1,
        payload: {},
      }),
    ).toThrow();
  });

  it("accepts a Swift-compatible flat payload when metadata versions are supplied", () => {
    const envelope = parsePayloadEnvelope(
      {
        recordType: "asset",
        id: "b8805a78-b5a5-4fe7-a83f-716117184d25",
        symbol: "VWCE",
      },
      {
        payloadVersion: 1,
        schemaVersion: 1,
      },
    );

    expect(envelope).toEqual({
      type: "asset",
      payloadVersion: 1,
      schemaVersion: 1,
      payload: {
        recordType: "asset",
        id: "b8805a78-b5a5-4fe7-a83f-716117184d25",
        symbol: "VWCE",
      },
    });
  });
});
