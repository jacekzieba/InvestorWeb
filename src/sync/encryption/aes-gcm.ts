import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  utf8ToBytes,
} from "./base64";

const AES_GCM_NONCE_BYTES = 12;

export type EncryptedPayload = {
  encryptedPayload: string;
  nonce: string;
};

function toArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function importAesGcmKey(rawKey: Uint8Array) {
  if (rawKey.byteLength !== 32) {
    throw new Error("AES-GCM userDataKey must be exactly 256 bits.");
  }

  return crypto.subtle.importKey("raw", toArrayBuffer(rawKey), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptJsonPayload(
  key: CryptoKey,
  payload: unknown,
): Promise<EncryptedPayload> {
  const nonce = crypto.getRandomValues(new Uint8Array(AES_GCM_NONCE_BYTES));
  const plaintext = utf8ToBytes(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(nonce) },
    key,
    toArrayBuffer(plaintext),
  );

  return {
    encryptedPayload: bytesToBase64(new Uint8Array(encrypted)),
    nonce: bytesToBase64(nonce),
  };
}

export async function decryptJsonPayload<T>(
  key: CryptoKey,
  encryptedPayload: string,
  nonce: string,
): Promise<T> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(nonce)) },
    key,
    toArrayBuffer(base64ToBytes(encryptedPayload)),
  );

  return JSON.parse(bytesToUtf8(new Uint8Array(decrypted))) as T;
}
