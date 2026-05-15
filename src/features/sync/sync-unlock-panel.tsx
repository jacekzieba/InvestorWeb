"use client";

import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClientOrNull } from "@/supabase/client";
import { unlockUserDataKey } from "@/sync/encryption/key-backup";
import { decryptEncryptedRecords } from "@/sync/records/encrypted-records";
import { buildInvestorDataSnapshot } from "@/sync/records/investor-snapshot";
import {
  fetchActiveEncryptedRecords,
  fetchEncryptedKeyBackup,
} from "@/sync/records/supabase-sync-store";
import {
  summarizeDecryptedRecords,
  type SyncRecordSummary,
} from "@/sync/records/sync-summary";
import type { InvestorDataSnapshot } from "@/domain/models/investor-data";

type SessionStatus =
  | "checking"
  | "config-missing"
  | "unauthenticated"
  | "authenticated";

type UnlockStatus = "idle" | "unlocking" | "ready" | "error";

export type SyncLoadResult = {
  summary: SyncRecordSummary;
  snapshot: InvestorDataSnapshot;
};

export function SyncUnlockPanel({
  onSyncLoaded,
}: {
  onSyncLoaded(result: SyncLoadResult | null): void;
}) {
  const supabase = useMemo(() => createBrowserSupabaseClientOrNull(), []);
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("checking");
  const [session, setSession] = useState<Session | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus>("idle");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<SyncRecordSummary | null>(
    null,
  );

  useEffect(() => {
    if (!supabase) {
      setSessionStatus("config-missing");
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error) {
        setSession(null);
        setSessionStatus("unauthenticated");
        return;
      }

      setSession(data.session);
      setSessionStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setSessionStatus(nextSession ? "authenticated" : "unauthenticated");
        setLastSummary(null);
        onSyncLoaded(null);
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [onSyncLoaded, supabase]);

  const keyBackupQuery = useQuery({
    queryKey: ["encrypted-key-backup", session?.user.id],
    enabled: Boolean(supabase && session),
    queryFn: () => {
      if (!supabase) {
        throw new Error("Supabase client is not configured.");
      }

      return fetchEncryptedKeyBackup(supabase);
    },
  });

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !keyBackupQuery.data) {
      return;
    }

    setUnlockStatus("unlocking");
    setUnlockError(null);

    try {
      const userDataKey = await unlockUserDataKey(
        keyBackupQuery.data,
        passphrase,
      );
      const encryptedRecords = await fetchActiveEncryptedRecords(supabase);
      const decryptedRecords = await decryptEncryptedRecords(
        userDataKey,
        encryptedRecords,
      );
      const summary = summarizeDecryptedRecords(decryptedRecords);
      const snapshot = buildInvestorDataSnapshot(decryptedRecords);

      setLastSummary(summary);
      onSyncLoaded({ summary, snapshot });
      setPassphrase("");
      setUnlockStatus("ready");
    } catch (error) {
      setUnlockStatus("error");
      setUnlockError(
        error instanceof Error
          ? error.message
          : "Nie udało się odblokować danych.",
      );
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }

  if (sessionStatus === "config-missing") {
    return (
      <SyncPanelFrame
        icon={ShieldAlert}
        title="Sync nie jest skonfigurowany"
        detail="Dashboard działa w trybie demo. Ustaw NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY, żeby włączyć logowanie i pobieranie zaszyfrowanych rekordów."
      />
    );
  }

  if (sessionStatus === "checking") {
    return (
      <SyncPanelFrame
        icon={Loader2}
        title="Sprawdzanie sesji"
        detail="Weryfikuję lokalną sesję Supabase."
        iconClassName="animate-spin"
      />
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <SyncPanelFrame
        icon={LogIn}
        title="Zaloguj się, żeby pobrać sync"
        detail="Po zalogowaniu web pobierze backup klucza i odszyfruje rekordy lokalnie w przeglądarce."
        action={
          <Link href="/login" className="btn btn-primary btn-sm">
            Przejdź do logowania
          </Link>
        }
      />
    );
  }

  const hasBackup = Boolean(keyBackupQuery.data);
  const isBusy = unlockStatus === "unlocking";

  return (
    <section className="rounded-lg border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            {lastSummary ? (
              <CheckCircle2 size={20} aria-hidden />
            ) : (
              <KeyRound size={20} aria-hidden />
            )}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Odblokowanie prywatnego sync
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral/65">
              Zalogowano jako {session?.user.email ?? session?.user.id}. Klucz
              danych pozostaje tylko w pamięci tej karty.
            </p>
            {lastSummary ? (
              <p className="mt-2 text-sm text-success">
                Odszyfrowano {lastSummary.totalRecords} rekordów. Ostatnia
                zmiana:{" "}
                {lastSummary.latestUpdatedAt
                  ? new Date(lastSummary.latestUpdatedAt).toLocaleString(
                      "pl-PL",
                    )
                  : "brak rekordów"}
                .
              </p>
            ) : null}
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
          <LogOut size={16} aria-hidden />
          Wyloguj
        </button>
      </div>

      {keyBackupQuery.isLoading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-neutral/60">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Pobieranie backupu klucza...
        </div>
      ) : null}

      {keyBackupQuery.isError ? (
        <p className="mt-5 text-sm text-error">
          Nie udało się pobrać backupu klucza:{" "}
          {keyBackupQuery.error instanceof Error
            ? keyBackupQuery.error.message
            : "nieznany błąd"}
        </p>
      ) : null}

      {!keyBackupQuery.isLoading && !hasBackup ? (
        <p className="mt-5 text-sm text-warning">
          Konto nie ma jeszcze backupu klucza w `encrypted_key_backups`.
        </p>
      ) : null}

      {hasBackup ? (
        <form
          className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={handleUnlock}
        >
          <label className="form-control">
            <span className="label-text">Passphrase backupu klucza</span>
            <input
              className="input input-bordered mt-1"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="btn btn-primary self-end"
            disabled={isBusy || passphrase.length === 0}
          >
            {isBusy ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <KeyRound size={16} aria-hidden />
            )}
            Odblokuj dane
          </button>
        </form>
      ) : null}

      {unlockStatus === "error" ? (
        <p className="mt-3 text-sm text-error">
          {unlockError ?? "Nie udało się odblokować danych."}
        </p>
      ) : null}
    </section>
  );
}

function SyncPanelFrame({
  icon: Icon,
  title,
  detail,
  action,
  iconClassName,
}: {
  icon: typeof KeyRound;
  title: string;
  detail: string;
  action?: React.ReactNode;
  iconClassName?: string;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-base-300 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon size={20} className={iconClassName} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-neutral/65">{detail}</p>
        </div>
      </div>
      {action}
    </section>
  );
}
