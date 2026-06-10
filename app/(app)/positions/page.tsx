import { PositionsPage } from "@/features/positions/positions-page";
import { ScreenView } from "@/features/telemetry/screen-view";
import { TelemetryEvent } from "@/lib/telemetry";

export default function Page() {
  return (
    <>
      <ScreenView event={TelemetryEvent.positionsViewed} screen="positions" />
      <PositionsPage />
    </>
  );
}
