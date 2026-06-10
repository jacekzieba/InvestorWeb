"use client";

import { useEffect } from "react";
import { getTelemetryService } from "@/lib/telemetry";
import { useSyncStore } from "@/sync/store/sync-store";

/**
 * Feeds the telemetry gate from the synced settings record. Mounts once near the
 * app root. When consent flags arrive (telemetryEnabled + privacy disclosure),
 * `update()` opens the gate and emits `app_launched` exactly once.
 */
export function TelemetryBootstrap() {
  const settings = useSyncStore((state) => state.snapshot?.settings);

  useEffect(() => {
    if (!settings) return;
    getTelemetryService().update({
      telemetryEnabled: settings.telemetryEnabled,
      hasAcknowledgedPrivacyDisclosure: settings.hasAcknowledgedPrivacyDisclosure,
      syncMode: settings.syncMode,
    });
  }, [
    settings?.telemetryEnabled,
    settings?.hasAcknowledgedPrivacyDisclosure,
    settings?.syncMode,
    settings,
  ]);

  return null;
}
