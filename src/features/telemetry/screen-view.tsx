"use client";

import { useEffect } from "react";
import { getTelemetryService, type TelemetryEventName } from "@/lib/telemetry";

/**
 * Drop-in telemetry marker for a route. Emits a `*_viewed` signal once on mount.
 * No-op unless the consent gate is open, so it is safe on every page.
 */
export function ScreenView({
  event,
  screen,
}: {
  event: TelemetryEventName;
  screen: string;
}) {
  useEffect(() => {
    getTelemetryService().signal(event, { screen });
  }, [event, screen]);
  return null;
}
