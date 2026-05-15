import { describe, expect, it } from "vitest";
import fixture from "../fixtures/crypto/aes-gcm-webcrypto.example.json";
import {
  decryptJsonPayload,
  encryptJsonPayload,
  encryptJsonPayloadWithNonce,
  importAesGcmKey,
} from "@/sync/encryption/aes-gcm";
import { base64ToBytes } from "@/sync/encryption/base64";

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

  it("matches a deterministic ciphertext || auth tag fixture", async () => {
    const key = await importAesGcmKey(base64ToBytes(fixture.keyBase64));

    const encrypted = await encryptJsonPayloadWithNonce(
      key,
      fixture.plaintext,
      base64ToBytes(fixture.nonceBase64),
    );
    const decrypted = await decryptJsonPayload<typeof fixture.plaintext>(
      key,
      fixture.encryptedPayloadBase64,
      fixture.nonceBase64,
    );

    expect(encrypted).toEqual({
      encryptedPayload: fixture.encryptedPayloadBase64,
      nonce: fixture.nonceBase64,
    });
    expect(decrypted).toEqual(fixture.plaintext);
  });
});
