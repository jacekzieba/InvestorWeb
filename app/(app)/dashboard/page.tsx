import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import { ScreenView } from "@/features/telemetry/screen-view";
import { TelemetryEvent } from "@/lib/telemetry";

export default function DashboardPage() {
  return (
    <>
      <ScreenView event={TelemetryEvent.dashboardViewed} screen="dashboard" />
      <DashboardOverview />
    </>
  );
}
