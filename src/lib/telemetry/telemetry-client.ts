import TelemetryDeck from "@telemetrydeck/sdk";

// SDK-agnostic seam, mirroring native `TelemetryClient`. The service talks only
// to this interface, so tests inject a mock and dev/SSR uses the noop.
export interface TelemetryClient {
  initialize(appID: string): void;
  signal(name: string, parameters: Record<string, string>): void;
}

/** Sends nothing. Used in tests, during SSR, and when no app ID is configured. */
export class NoopTelemetryClient implements TelemetryClient {
  initialize(): void {}
  signal(): void {}
}

/**
 * Wraps the TelemetryDeck JS SDK. `clientUser` is a per-browser anonymous id;
 * the SDK hashes it with a salt before sending, so the server never sees it.
 * It is NOT the Supabase user id (that is reserved for RevenueCat).
 */
export class TelemetryDeckClient implements TelemetryClient {
  private td: TelemetryDeck | null = null;
  private readonly clientUser: string;
  private readonly testMode: boolean;

  constructor(clientUser: string, options: { testMode?: boolean } = {}) {
    this.clientUser = clientUser;
    this.testMode = options.testMode ?? false;
  }

  initialize(appID: string): void {
    if (this.td) return;
    this.td = new TelemetryDeck({
      appID,
      clientUser: this.clientUser,
      testMode: this.testMode,
    });
  }

  signal(name: string, parameters: Record<string, string>): void {
    // Fire-and-forget: telemetry must never block or throw into the UI.
    void this.td?.signal(name, parameters).catch(() => {});
  }
}

const ANON_ID_KEY = "iw_td_anon";

/** Stable per-browser anonymous id, persisted so retention works across
 * sessions. Random — carries no user identity. */
export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    // localStorage blocked (private mode / disabled) — fall back to ephemeral.
    return crypto.randomUUID();
  }
}
