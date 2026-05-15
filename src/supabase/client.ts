"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "./types";

export function hasBrowserSupabaseConfig() {
  return Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createBrowserSupabaseClient() {
  const supabaseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
  );
}

export type BrowserSupabaseClient = ReturnType<
  typeof createBrowserSupabaseClient
>;

export function createBrowserSupabaseClientOrNull() {
  if (!hasBrowserSupabaseConfig()) {
    return null;
  }

  return createBrowserSupabaseClient();
}
