import type { BrowserSupabaseClient } from "@/supabase/client";
import type { EncryptedKeyBackup } from "@/sync/encryption/key-backup";
import { encryptedRecordSchema } from "@/sync/envelopes/envelope";
import type { EncryptedRecord } from "./encrypted-records";

export async function fetchEncryptedKeyBackup(
  supabase: BrowserSupabaseClient,
): Promise<EncryptedKeyBackup | null> {
  const { data, error } = await supabase
    .from("encrypted_key_backups")
    .select("encrypted_user_data_key, nonce, salt, kdf, kdf_iterations")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchActiveEncryptedRecords(
  supabase: BrowserSupabaseClient,
): Promise<EncryptedRecord[]> {
  const { data, error } = await supabase
    .from("encrypted_records")
    .select(
      [
        "id",
        "user_id",
        "record_type",
        "encrypted_payload",
        "nonce",
        "payload_version",
        "schema_version",
        "device_id",
        "created_at",
        "updated_at",
        "deleted_at",
      ].join(", "),
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((record) => encryptedRecordSchema.parse(record));
}
