import { describe, expect, it } from "vitest";
import fixture from "../fixtures/crypto/aes-gcm-webcrypto.example.json";
import { base64ToBytes } from "@/sync/encryption/base64";
import { importAesGcmKey } from "@/sync/encryption/aes-gcm";
import { decryptEncryptedRecord } from "@/sync/records/encrypted-records";

describe("encrypted records", () => {
  it("decrypts and validates record metadata against the payload envelope", async () => {
    const key = await importAesGcmKey(base64ToBytes(fixture.keyBase64));

    const record = await decryptEncryptedRecord(key, fixture.record);

    expect(record.id).toBe(fixture.record.id);
    expect(record.deviceId).toBe("webcrypto-fixture");
    expect(record.envelope).toEqual({
      type: "transaction",
      payloadVersion: 1,
      schemaVersion: 1,
      payload: fixture.plaintext,
    });
  });

  it("rejects metadata/envelope type mismatches", async () => {
    const key = await importAesGcmKey(base64ToBytes(fixture.keyBase64));

    await expect(
      decryptEncryptedRecord(key, {
        ...fixture.record,
        record_type: "asset",
      }),
    ).rejects.toThrow("Encrypted record type mismatch");
  });
});
