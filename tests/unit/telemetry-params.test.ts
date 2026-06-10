import { describe, expect, it } from "vitest";
import { telemetryRowBucket, telemetrySnakeCased } from "@/lib/telemetry";

// These must match the native helpers in TelemetryService.swift exactly.
describe("telemetry params", () => {
  it("snake-cases categorical values like native", () => {
    expect(telemetrySnakeCased("bondCoupon")).toBe("bond_coupon");
    expect(telemetrySnakeCased("cashDeposit")).toBe("cash_deposit");
    expect(telemetrySnakeCased("pkoBonds")).toBe("pko_bonds");
    expect(telemetrySnakeCased("accountTransferIn")).toBe("account_transfer_in");
    expect(telemetrySnakeCased("buy")).toBe("buy");
  });

  it("buckets row counts like native", () => {
    expect(telemetryRowBucket(1)).toBe("1_5");
    expect(telemetryRowBucket(5)).toBe("1_5");
    expect(telemetryRowBucket(6)).toBe("6_20");
    expect(telemetryRowBucket(21)).toBe("21_50");
    expect(telemetryRowBucket(120)).toBe("50_plus");
  });
});
