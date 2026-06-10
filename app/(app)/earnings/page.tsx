import { EarningsPage } from "@/features/earnings/earnings-page";
import { ScreenView } from "@/features/telemetry/screen-view";
import { TelemetryEvent } from "@/lib/telemetry";

export default function EarningsRoute() {
  return (
    <>
      <ScreenView event={TelemetryEvent.earningsViewed} screen="earnings" />
      <EarningsPage />
    </>
  );
}
