import { SettingsPage } from "@/features/settings/settings-page";
import { ScreenView } from "@/features/telemetry/screen-view";
import { TelemetryEvent } from "@/lib/telemetry";

export default function SettingsRoute() {
  return (
    <>
      <ScreenView event={TelemetryEvent.settingsViewed} screen="settings" />
      <SettingsPage />
    </>
  );
}
