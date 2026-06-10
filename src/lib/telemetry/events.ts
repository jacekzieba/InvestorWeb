// Wire names for TelemetryDeck signals. These MUST stay 1:1 with the native
// `TelemetryEvent` enum and docs/TELEMETRY_CONTRACT.md. Do not add an event
// here without adding it to the contract first.

export const TelemetryEvent = {
  appLaunched: "app_launched",
  dashboardViewed: "dashboard_viewed",
  positionsViewed: "positions_viewed",
  transactionsViewed: "transactions_viewed",
  earningsViewed: "earnings_viewed",
  settingsViewed: "settings_viewed",
  sampleDataLoaded: "sample_data_loaded",
  syncModeChanged: "sync_mode_changed",
  // Phase B — emitted once the web write path exists. Names reserved now so
  // the data is comparable with native from day one.
  transactionAdded: "transaction_added",
  earningAdded: "earning_added",
  brokerImportStarted: "broker_import_started",
  brokerImportSucceeded: "broker_import_succeeded",
  brokerImportFailed: "broker_import_failed",
} as const;

export type TelemetryEventName =
  (typeof TelemetryEvent)[keyof typeof TelemetryEvent];

export const ORGANIZATION = "com.jacekzieba";
