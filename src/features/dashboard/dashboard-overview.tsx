"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Clock3,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { PortfolioValueChart } from "@/components/charts/portfolio-value-chart";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatPercent } from "@/lib/money";
import {
  SyncUnlockPanel,
  type SyncLoadResult,
} from "@/features/sync/sync-unlock-panel";
import { sampleSnapshot } from "./sample-data";

export function DashboardOverview() {
  const [syncResult, setSyncResult] = useState<SyncLoadResult | null>(null);
  const snapshot = syncResult?.snapshot ?? sampleSnapshot;
  const syncSummary = syncResult?.summary ?? null;
  const syncStatus = syncSummary ? "Odszyfrowano" : "Demo";
  const syncDetail = syncSummary
    ? `${syncSummary.totalRecords} rekordów, dashboard z realnego sync`
    : "Podłącz Supabase i odblokuj backup klucza";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-ink">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/65">
            {syncResult
              ? "Read-only dashboard złożony z odszyfrowanych rekordów sync."
              : "Tryb demo pokazuje układ docelowego dashboardu przed odblokowaniem sync."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-base-300 bg-white px-3 py-2 text-sm text-neutral/65">
          <Clock3 size={16} aria-hidden />
          Stan na {new Date(snapshot.asOf).toLocaleString("pl-PL")}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Wartość portfela"
          value={formatCurrency(snapshot.totalValue, "PLN")}
          detail={`${formatPercent(snapshot.monthlyChange)} w tym miesiącu`}
          icon={WalletCards}
          tone="positive"
        />
        <StatCard
          label="Gotówka"
          value={formatCurrency(snapshot.cash, "PLN")}
          detail="Środki dostępne bez sprzedaży aktywów"
          icon={Banknote}
        />
        <StatCard
          label="Status sync"
          value={syncStatus}
          detail={syncDetail}
          icon={Activity}
          tone={syncSummary ? "positive" : "warning"}
        />
      </section>

      <SyncUnlockPanel onSyncLoaded={setSyncResult} />

      {syncSummary ? (
        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Object.entries(syncSummary.byType).map(([type, count]) => (
            <div
              key={type}
              className="rounded-lg border border-base-300 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-normal text-neutral/50">
                {type}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">{count}</p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <article className="chart-panel rounded-lg border border-base-300 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Wartość w czasie
              </h2>
              <p className="mt-1 text-sm text-neutral/60">
                Chart.js jako domyślny renderer dashboardowy.
              </p>
            </div>
          </div>
          <div className="h-80">
            <PortfolioValueChart points={snapshot.valuationSeries} />
          </div>
        </article>

        <article className="chart-panel rounded-lg border border-base-300 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Alokacja</h2>
          <p className="mt-1 text-sm text-neutral/60">
            Udział klas aktywów w odszyfrowanym snapshotcie.
          </p>
          <div className="mt-6 h-72">
            <AllocationChart slices={snapshot.allocation} />
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-base-300 bg-white shadow-sm">
        <div className="border-b border-base-300 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Portfele</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Waluta</th>
                <th className="text-right">Pozycje</th>
                <th className="text-right">Zmiana dzienna</th>
                <th className="text-right">Wartość</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.portfolios.map((portfolio) => {
                const isPositive = portfolio.dailyChange >= 0;
                const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;

                return (
                  <tr key={portfolio.id}>
                    <td className="font-medium text-ink">{portfolio.name}</td>
                    <td>{portfolio.baseCurrency}</td>
                    <td className="text-right">{portfolio.positions}</td>
                    <td className="text-right">
                      <span
                        className={
                          isPositive
                            ? "inline-flex items-center justify-end gap-1 text-success"
                            : "inline-flex items-center justify-end gap-1 text-error"
                        }
                      >
                        <ChangeIcon size={16} aria-hidden />
                        {formatPercent(portfolio.dailyChange)}
                      </span>
                    </td>
                    <td className="text-right font-medium text-ink">
                      {formatCurrency(portfolio.value, portfolio.baseCurrency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
