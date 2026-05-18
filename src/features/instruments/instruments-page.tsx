"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { InstrumentEditorModal } from "@/features/instruments/instrument-editor-modal";
import { deleteRecord, refreshSyncStore } from "@/sync/records/record-writer";
import { useSyncStore } from "@/sync/store/sync-store";
import { buildInstrumentList } from "@/sync/records/investor-snapshot";

const INK = "#1C3144";
const MUTED = "rgba(28,49,68,0.58)";
const SUBTLE = "rgba(28,49,68,0.38)";
const LINE_SOFT = "rgba(28,49,68,0.06)";
const PROFIT = "#2D9C6B";

const glassCard: CSSProperties = {
  background: "rgba(255,253,249,0.82)",
  backdropFilter: "blur(30px) saturate(160%)",
  WebkitBackdropFilter: "blur(30px) saturate(160%)",
  borderRadius: 16,
  border: "0.5px solid rgba(255,255,255,0.7)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 0 rgba(28,49,68,0.04), 0 4px 16px rgba(28,49,68,0.05)",
};

const KIND_LABELS: Record<string, string> = {
  stock: "Akcja",
  etf: "ETF",
  treasuryBond: "Obl. skarbowa",
  listedBond: "Obl. giełdowa",
  crypto: "Kryptowaluta",
  deposit: "Lokata",
  cash: "Gotówka",
};

const KIND_COLORS: Record<string, string> = {
  stock: "#34699A",
  etf: "#2D9C6B",
  treasuryBond: "#8A7A3C",
  listedBond: "#7EA16B",
  crypto: "#9B6BC4",
  deposit: "#C97B30",
  cash: "#5E6C84",
};

const KIND_ALL = "all";

function fmt(n: number, d = 0) {
  return n.toLocaleString("pl-PL", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtQty(n: number) {
  if (n === 0) return "—";
  if (Number.isInteger(n)) return fmt(n);
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });
}

type KindFilter = typeof KIND_ALL | string;
type HeldFilter = "all" | "held" | "closed";

export function InstrumentsPage() {
  const records = useSyncStore((s) => s.records);
  const userDataKey = useSyncStore((s) => s.userDataKey);
  const supabase = useSyncStore((s) => s.supabase);
  const setSync = useSyncStore((s) => s.setSync);

  const allInstruments = useMemo(
    () => (records ? buildInstrumentList(records) : []),
    [records],
  );

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>(KIND_ALL);
  const [heldFilter, setHeldFilter] = useState<HeldFilter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingInstrumentId, setEditingInstrumentId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const kinds = useMemo(() => {
    const seen = new Set<string>();
    for (const inst of allInstruments) seen.add(inst.kind);
    return [...seen].sort();
  }, [allInstruments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allInstruments.filter((inst) => {
      if (kindFilter !== KIND_ALL && inst.kind !== kindFilter) return false;
      if (heldFilter === "held" && inst.totalQuantity <= 0) return false;
      if (heldFilter === "closed" && inst.totalQuantity > 0) return false;
      if (q) {
        const hay = [inst.name, inst.symbol, KIND_LABELS[inst.kind] ?? inst.kind, inst.currency]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allInstruments, kindFilter, heldFilter, search]);

  const totalValue = useMemo(
    () => filtered.filter((i) => i.totalQuantity > 0).reduce((s, i) => s + i.marketValue, 0),
    [filtered],
  );

  const heldCount = useMemo(() => allInstruments.filter((i) => i.totalQuantity > 0).length, [allInstruments]);
  const editableInstruments = useMemo(() => {
    if (!records) {
      return [];
    }

    return records
      .filter((record) => !record.deletedAt && record.envelope.type === "asset")
      .map((record) => {
        const payload = record.envelope.payload as {
          id: string;
          symbol: string;
          name: string;
          kind: string;
          currency: string;
          category?: string | null;
        };

        return {
          id: payload.id,
          symbol: payload.symbol,
          name: payload.name,
          kind: payload.kind,
          currency: payload.currency,
          category: payload.category ?? null,
          updatedAt: record.updatedAt,
        };
      });
  }, [records]);

  const editingInstrument = editingInstrumentId
    ? editableInstruments.find((instrument) => instrument.id === editingInstrumentId) ?? null
    : null;

  async function handleDeleteInstrument(id: string) {
    if (!userDataKey || !supabase || !records) {
      return;
    }

    const linkedRecords = records.filter((record) => {
      if (record.deletedAt) {
        return false;
      }

      if (record.envelope.type === "transaction") {
        return (record.envelope.payload as { instrumentID?: string | null }).instrumentID === id;
      }

      if (record.envelope.type === "manualValuation") {
        return (record.envelope.payload as { instrumentID?: string }).instrumentID === id;
      }

      return false;
    }).length;

    if (linkedRecords > 0) {
      window.alert("Nie można usunąć instrumentu, który ma wyceny albo transakcje.");
      return;
    }

    if (!window.confirm("Usunąć instrument?")) {
      return;
    }

    setDeletingId(id);

    try {
      const sourceRecord = records.find(
        (record) =>
          !record.deletedAt &&
          record.envelope.type === "asset" &&
          record.id === id,
      );
      const result = await deleteRecord(supabase, "asset", id, {
        baseUpdatedAt: sourceRecord?.updatedAt ?? null,
      });
      if (!result.queued) {
        const { records: nextRecords, snapshot: nextSnapshot } = await refreshSyncStore(
          supabase,
          userDataKey,
        );
        setSync(nextRecords, nextSnapshot);
      }
    } finally {
      setDeletingId(null);
    }
  }

  const selectStyle: CSSProperties = {
    padding: "7px 12px",
    borderRadius: 9,
    border: "0.5px solid rgba(28,49,68,0.12)",
    background: "rgba(255,255,255,0.7)",
    color: INK,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    appearance: "none" as const,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div
        style={{
          padding: "0 2px 4px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>
            Instrumenty
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
            {records
              ? `${allInstruments.length} instrumentów · ${heldCount} w portfelu`
              : "Odblokuj dane na dashboardzie"}
          </div>
        </div>
        <button
          onClick={() => {
            setEditingInstrumentId(null);
            setEditorOpen(true);
          }}
          disabled={!userDataKey}
          style={{
            padding: "8px 14px",
            borderRadius: 9,
            border: "none",
            background: userDataKey ? INK : "rgba(28,49,68,0.12)",
            color: userDataKey ? "#fff" : SUBTLE,
            fontSize: 13,
            fontWeight: 700,
            cursor: userDataKey ? "pointer" : "not-allowed",
            fontFamily: "inherit",
          }}
        >
          + Dodaj instrument
        </button>
      </div>

      {/* Summary chips */}
      {records && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Wszystkie", value: "all" as HeldFilter },
            { label: "W portfelu", value: "held" as HeldFilter },
            { label: "Zamknięte", value: "closed" as HeldFilter },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setHeldFilter(value)}
              style={{
                padding: "7px 14px",
                borderRadius: 99,
                border: "0.5px solid rgba(28,49,68,0.12)",
                background: heldFilter === value ? INK : "rgba(255,255,255,0.7)",
                color: heldFilter === value ? "#fff" : MUTED,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: heldFilter === value
                  ? "0 2px 8px rgba(28,49,68,0.18)"
                  : "none",
                transition: "all .15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {records && (
        <div
          style={{
            ...glassCard,
            padding: "14px 18px",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: SUBTLE,
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
            <input
              type="text"
              placeholder="Szukaj nazwy, symbolu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 12px 7px 30px",
                borderRadius: 9,
                border: "0.5px solid rgba(28,49,68,0.12)",
                background: "rgba(255,255,255,0.7)",
                color: INK,
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} style={selectStyle}>
            <option value={KIND_ALL}>Wszystkie klasy</option>
            {kinds.map((k) => (
              <option key={k} value={k}>{KIND_LABELS[k] ?? k}</option>
            ))}
          </select>

          {(search || kindFilter !== KIND_ALL) && (
            <button
              onClick={() => { setSearch(""); setKindFilter(KIND_ALL); }}
              style={{
                padding: "7px 12px",
                borderRadius: 9,
                border: "0.5px solid rgba(28,49,68,0.12)",
                background: "transparent",
                color: MUTED,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Wyczyść ×
            </button>
          )}

          <div style={{ marginLeft: "auto", fontSize: 12, color: SUBTLE }}>
            {filtered.length} wyników
            {totalValue > 0 && (
              <> · <strong style={{ color: INK }}>{fmt(totalValue)} PLN</strong></>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ ...glassCard, padding: 0 }}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,2.5fr) 80px minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,1.1fr) minmax(0,1fr) 130px",
            padding: "10px 22px",
            background: "rgba(28,49,68,0.025)",
            borderBottom: `0.5px solid ${LINE_SOFT}`,
            borderRadius: "16px 16px 0 0",
          }}
        >
          {["Instrument", "Klasa", "Ilość", "Cena", "Wartość", "Portfele", "Akcje"].map((h, i) => (
            <div
              key={h}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: SUBTLE,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                textAlign: i <= 1 ? "left" : "right",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {!records && (
          <div style={{ padding: "48px 22px", textAlign: "center" }}>
            <div style={{ fontSize: 32, opacity: 0.12, marginBottom: 12 }}>◈</div>
            <div style={{ fontSize: 14, color: SUBTLE }}>
              Odblokuj dane na{" "}
              <Link href="/dashboard" style={{ color: INK, fontWeight: 600 }}>
                dashboardzie
              </Link>
            </div>
          </div>
        )}

        {records && filtered.length === 0 && (
          <div style={{ padding: "32px 22px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: SUBTLE }}>Brak instrumentów dla wybranych filtrów</div>
          </div>
        )}

        {filtered.map((inst) => {
          const color = KIND_COLORS[inst.kind] ?? SUBTLE;
          const kindLabel = KIND_LABELS[inst.kind] ?? inst.kind;
          const isHeld = inst.totalQuantity > 0;

          return (
            <div
              key={inst.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,2.5fr) 80px minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,1.1fr) minmax(0,1fr) 130px",
                padding: "14px 22px",
                borderTop: `0.5px solid ${LINE_SOFT}`,
                alignItems: "center",
                opacity: isHeld ? 1 : 0.5,
                transition: "background .12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(28,49,68,0.025)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Name + symbol */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: `${color}14`,
                    border: `1.5px solid ${color}${isHeld ? "40" : "20"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    color: isHeld ? color : `${color}80`,
                    flexShrink: 0,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {inst.symbol.slice(0, 4).toUpperCase()}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{inst.name}</div>
                  <div style={{ fontSize: 11, color: SUBTLE }}>{inst.symbol} · {inst.currency}</div>
                </div>
              </div>

              {/* Kind badge */}
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 7px",
                    borderRadius: 6,
                    background: `${color}12`,
                    color,
                    fontSize: 10,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {kindLabel}
                </span>
              </div>

              {/* Quantity */}
              <div style={{ textAlign: "right", fontSize: 13, color: isHeld ? INK : SUBTLE, fontVariantNumeric: "tabular-nums" }}>
                {fmtQty(inst.totalQuantity)}
              </div>

              {/* Last price */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: INK, fontVariantNumeric: "tabular-nums" }}>
                  {inst.lastPrice > 0 ? fmt(inst.lastPrice, 2) : "—"}
                </div>
                {inst.lastPriceDate && (
                  <div style={{ fontSize: 10, color: SUBTLE }}>{fmtDate(inst.lastPriceDate)}</div>
                )}
              </div>

              {/* Market value */}
              <div style={{ textAlign: "right" }}>
                {isHeld ? (
                  <div style={{ fontSize: 14, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(inst.marketValue)}{" "}
                    <span style={{ fontSize: 10, opacity: 0.5 }}>PLN</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: SUBTLE }}>—</div>
                )}
              </div>

              {/* Portfolios */}
              <div style={{ textAlign: "right" }}>
                {inst.portfolios.length > 0 ? (
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {inst.portfolios.map((pf) => (
                      <span
                        key={pf}
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 5,
                          background: `${PROFIT}14`,
                          color: PROFIT,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pf}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: SUBTLE }}>—</span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  onClick={() => {
                    setEditingInstrumentId(inst.id);
                    setEditorOpen(true);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "0.5px solid rgba(28,49,68,0.12)",
                    background: "rgba(255,255,255,0.7)",
                    color: MUTED,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Edytuj
                </button>
                <button
                  onClick={() => void handleDeleteInstrument(inst.id)}
                  disabled={!userDataKey || deletingId === inst.id}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "0.5px solid rgba(184,80,66,0.18)",
                    background: deletingId === inst.id ? "rgba(184,80,66,0.08)" : "transparent",
                    color: deletingId === inst.id ? "#B85042" : SUBTLE,
                    fontSize: 12,
                    cursor: !userDataKey || deletingId === inst.id ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {deletingId === inst.id ? "Usuwam…" : "Usuń"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <InstrumentEditorModal
        open={editorOpen}
        initialValue={editingInstrument}
        onClose={() => {
          setEditorOpen(false);
          setEditingInstrumentId(null);
        }}
      />
    </div>
  );
}
