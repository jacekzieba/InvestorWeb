"use client";

import { useEffect } from "react";
import { getTelemetryService, TelemetryEvent } from "@/lib/telemetry";

/**
 * Emits `sample_data_loaded` once when a page falls back to demo/sample data
 * (user not synced). No-op unless the consent gate is open — which on web means
 * it effectively fires only if consent was granted before syncing real data.
 */
export function useSampleDataSignal(active: boolean) {
  useEffect(() => {
    if (!active) return;
    getTelemetryService().signal(TelemetryEvent.sampleDataLoaded);
  }, [active]);
}
