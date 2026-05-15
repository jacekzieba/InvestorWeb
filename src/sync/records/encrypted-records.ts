import { z } from "zod";
import { decryptJsonPayload } from "@/sync/encryption/aes-gcm";
import {
  encryptedRecordSchema,
  parsePayloadEnvelope,
  type PayloadEnvelope,
} from "@/sync/envelopes/envelope";

export type EncryptedRecord = z.infer<typeof encryptedRecordSchema>;

export type DecryptedRecord<TPayload = unknown> = {
  id: string;
  deviceId: string | null;
  updatedAt: string;
  deletedAt: string | null;
  envelope: PayloadEnvelope<TPayload>;
};

export async function decryptEncryptedRecord(
  userDataKey: CryptoKey,
  encryptedRecordInput: unknown,
): Promise<DecryptedRecord> {
  const record = encryptedRecordSchema.parse(encryptedRecordInput);
  const decryptedPayload = await decryptJsonPayload(
    userDataKey,
    record.encrypted_payload,
    record.nonce,
  );
  const envelope = parsePayloadEnvelope(decryptedPayload, {
    payloadVersion: record.payload_version,
    schemaVersion: record.schema_version,
  });

  if (envelope.type !== record.record_type) {
    throw new Error(
      `Encrypted record type mismatch: metadata=${record.record_type}, envelope=${envelope.type}`,
    );
  }

  if (envelope.payloadVersion !== record.payload_version) {
    throw new Error(
      `Payload version mismatch: metadata=${record.payload_version}, envelope=${envelope.payloadVersion}`,
    );
  }

  if (envelope.schemaVersion !== record.schema_version) {
    throw new Error(
      `Schema version mismatch: metadata=${record.schema_version}, envelope=${envelope.schemaVersion}`,
    );
  }

  return {
    id: record.id,
    deviceId: record.device_id,
    updatedAt: record.updated_at,
    deletedAt: record.deleted_at,
    envelope,
  };
}

export async function decryptEncryptedRecords(
  userDataKey: CryptoKey,
  encryptedRecords: unknown[],
) {
  return Promise.all(
    encryptedRecords.map((record) =>
      decryptEncryptedRecord(userDataKey, record),
    ),
  );
}
