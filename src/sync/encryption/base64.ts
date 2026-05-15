export function bytesToBase64(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");

  if (typeof btoa === "function") {
    return btoa(binary);
  }

  return Buffer.from(bytes).toString("base64");
}

export function base64ToBytes(base64: string) {
  if (typeof atob === "function") {
    return Uint8Array.from(atob(base64), (char) => char.codePointAt(0) ?? 0);
  }

  return Uint8Array.from(Buffer.from(base64, "base64"));
}

export function utf8ToBytes(value: string) {
  return new TextEncoder().encode(value);
}

export function bytesToUtf8(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}
