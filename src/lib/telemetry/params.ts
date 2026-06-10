// Web mirror of the native `telemetrySnakeCased` / `telemetryRowBucket` helpers
// so categorical parameter values match 1:1 across platforms.
// See docs/TELEMETRY_CONTRACT.md.

/** camelCase → snake_case (e.g. `cashDeposit` → `cash_deposit`). */
export function telemetrySnakeCased(value: string): string {
  let result = "";
  for (const char of value) {
    if (char >= "A" && char <= "Z") {
      if (result.length > 0) result += "_";
      result += char.toLowerCase();
    } else {
      result += char;
    }
  }
  return result;
}

/** Coarse size bucket so an exact count never leaks portfolio scale. */
export function telemetryRowBucket(count: number): string {
  if (count < 6) return "1_5";
  if (count < 21) return "6_20";
  if (count < 51) return "21_50";
  return "50_plus";
}
