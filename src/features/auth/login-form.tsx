"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus("error");
      return;
    }

    window.location.assign("/dashboard");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="form-control">
        <span className="label-text">Email</span>
        <input
          className="input input-bordered mt-1"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label className="form-control">
        <span className="label-text">Hasło</span>
        <input
          className="input input-bordered mt-1"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {status === "error" ? (
        <p className="text-sm text-error">
          Nie udało się zalogować. Sprawdź dane i konfigurację Supabase.
        </p>
      ) : null}
      <button className="btn btn-primary w-full" disabled={status === "loading"}>
        {status === "loading" ? "Logowanie..." : "Zaloguj"}
      </button>
    </form>
  );
}
