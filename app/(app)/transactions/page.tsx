import { TransactionsPage } from "@/features/transactions/transactions-page";
import { ScreenView } from "@/features/telemetry/screen-view";
import { TelemetryEvent } from "@/lib/telemetry";

export default function Transactions() {
  return (
    <>
      <ScreenView event={TelemetryEvent.transactionsViewed} screen="transactions" />
      <TransactionsPage />
    </>
  );
}
