import { z } from "zod";
import type { RecordType } from "@/domain/models/investor-data";

export const recordTypeSchema = z.enum([
  "account",
  "asset",
  "transaction",
  "manualValuation",
  "income",
  "settings",
]);

export const encryptedRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  record_type: recordTypeSchema,
  encrypted_payload: z.string().min(1),
  nonce: z.string().min(1),
  payload_version: z.number().int().positive(),
  schema_version: z.number().int().positive(),
  device_id: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const payloadEnvelopeSchema = z.object({
  type: recordTypeSchema,
  payloadVersion: z.number().int().positive(),
  schemaVersion: z.number().int().positive(),
  payload: z.unknown(),
});

export type PayloadEnvelope<TPayload = unknown> = {
  type: RecordType;
  payloadVersion: number;
  schemaVersion: number;
  payload: TPayload;
};

export function parsePayloadEnvelope(payload: unknown) {
  return payloadEnvelopeSchema.parse(payload);
}
