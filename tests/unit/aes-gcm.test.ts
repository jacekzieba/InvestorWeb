import { describe, expect, it } from "vitest";
import {
  decryptJsonPayload,
  encryptJsonPayload,
  importAesGcmKey,
} from "@/sync/encryption/aes-gcm";

describe("AES-GCM payload encryption", () => {
  it("roundtrips JSON using ciphertext and tag encoded together", async () => {
    const rawKey = new Uint8Array(32);
    rawKey.fill(7);
    const key = await importAesGcmKey(rawKey);
    const payload = {
      type: "transaction",
      payloadVersion: 1,
      schemaVersion: 1,
      payload: {
        amount: 1200,
        currency: "PLN",
      },
    };

    const encrypted = await encryptJsonPayload(key, payload);
    const decrypted = await decryptJsonPayload<typeof payload>(
      key,
      encrypted.encryptedPayload,
      encrypted.nonce,
    );

    expect(encrypted.nonce).toHaveLength(16);
    expect(decrypted).toEqual(payload);
  });
});
