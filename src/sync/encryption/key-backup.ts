import { base64ToBytes } from "./base64";
import { decryptBytes, importAesGcmKey, toArrayBuffer } from "./aes-gcm";

const SUPPORTED_KDFS = new Set(["PBKDF2-SHA256", "pbkdf2-sha256", "PBKDF2"]);

export type EncryptedKeyBackup = {
  encrypted_user_data_key: string;
  nonce: string;
  salt: string;
  kdf: string;
  kdf_iterations: number;
};

export async function deriveKeyEncryptionKey(
  passphrase: string,
  saltBase64: string,
  iterations: number,
) {
  if (iterations <= 0) {
    throw new Error("KDF iterations must be positive.");
  }

  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(base64ToBytes(saltBase64)),
      iterations,
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

export async function unlockUserDataKey(
  backup: EncryptedKeyBackup,
  passphrase: string,
) {
  if (!SUPPORTED_KDFS.has(backup.kdf)) {
    throw new Error(`Unsupported key backup KDF: ${backup.kdf}`);
  }

  const keyEncryptionKey = await deriveKeyEncryptionKey(
    passphrase,
    backup.salt,
    backup.kdf_iterations,
  );

  const userDataKey = await decryptBytes(
    keyEncryptionKey,
    backup.encrypted_user_data_key,
    backup.nonce,
  );

  return importAesGcmKey(userDataKey);
}
