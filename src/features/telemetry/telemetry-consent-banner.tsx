"use client";

import { useSyncStore } from "@/sync/store/sync-store";
import { V2, V2_TYPE, v2Mix } from "@/lib/v2-design";
import { useTelemetryConsent } from "./use-telemetry-consent";

/**
 * First-run privacy disclosure. Shown once the user is unlocked but has not yet
 * acknowledged the disclosure. Either choice acknowledges it, so it never
 * reappears; the choice (opt in / out) is synced to all devices.
 */
export function TelemetryConsentBanner() {
  const hasSnapshot = useSyncStore((s) => Boolean(s.snapshot));
  const { acknowledged, canWrite, saving, error, setConsent } =
    useTelemetryConsent();

  if (!hasSnapshot || !canWrite || acknowledged) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 22,
        transform: "translateX(-50%)",
        zIndex: 60,
        width: "min(560px, calc(100vw - 32px))",
        background: V2.card,
        border: `0.5px solid ${V2.line}`,
        borderRadius: 16,
        padding: "18px 20px",
        boxShadow: `0 18px 48px ${v2Mix(V2.ink, 0.18)}`,
        fontFamily: V2_TYPE.ui,
      }}
      role="dialog"
      aria-label="Zgoda na anonimową telemetrię"
    >
      <div
        style={{
          fontFamily: V2_TYPE.serif,
          fontSize: 17,
          fontWeight: 500,
          color: V2.ink,
        }}
      >
        Pomóż ulepszać aplikację
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: V2.muted,
          marginTop: 6,
          lineHeight: 1.5,
        }}
      >
        Możemy wysyłać anonimowe zdarzenia o tym, jak korzystasz z aplikacji (np.
        które ekrany otwierasz). Nigdy nie wysyłamy kwot, nazw instrumentów,
        e-maili ani danych portfela. Wybór zsynchronizuje się na wszystkich
        urządzeniach i zmienisz go w Ustawieniach.
      </div>

      {error && (
        <div style={{ fontSize: 12, color: V2.loss, marginTop: 8 }}>{error}</div>
      )}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 14,
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => setConsent(false)}
          disabled={saving}
          style={{
            padding: "9px 16px",
            borderRadius: 10,
            border: `0.5px solid ${V2.line}`,
            background: V2.card,
            color: V2.ink,
            fontFamily: V2_TYPE.ui,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          Nie teraz
        </button>
        <button
          onClick={() => setConsent(true)}
          disabled={saving}
          style={{
            padding: "9px 16px",
            borderRadius: 10,
            border: "none",
            background: V2.brand,
            color: "#fff",
            fontFamily: V2_TYPE.ui,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Zapisywanie…" : "Włącz telemetrię"}
        </button>
      </div>
    </div>
  );
}
