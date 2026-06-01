import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCachedUserDataKey,
  loadCachedUserDataKey,
  saveCachedUserDataKey,
} from "@/sync/encryption/key-cache";

type RequestHandler = ((event: Event) => void) | null;

type FakeRequest<TValue> = {
  result: TValue;
  error: DOMException | null;
  onsuccess: RequestHandler;
  onerror: RequestHandler;
  onupgradeneeded?: RequestHandler;
};

function resolveRequest<TValue>(request: FakeRequest<TValue>) {
  queueMicrotask(() => {
    request.onsuccess?.(new Event("success"));
  });
}

function createRequest<TValue>(result: TValue) {
  const request: FakeRequest<TValue> = {
    result,
    error: null,
    onsuccess: null,
    onerror: null,
  };
  resolveRequest(request);
  return request as unknown as IDBRequest<TValue>;
}

function installFakeIndexedDB() {
  const records = new Map<string, unknown>();
  const objectStoreNames = {
    contains(name: string) {
      return name === "user-data-keys";
    },
  };
  const objectStore = {
    get(key: IDBValidKey) {
      return createRequest(records.get(String(key)));
    },
    put(value: { userId: string }) {
      records.set(value.userId, value);
      return createRequest(value.userId);
    },
    delete(key: IDBValidKey) {
      records.delete(String(key));
      return createRequest(undefined);
    },
  };
  const db = {
    objectStoreNames,
    createObjectStore() {
      return objectStore;
    },
    transaction() {
      return {
        error: null,
        onerror: null,
        objectStore() {
          return objectStore;
        },
      };
    },
    close() {},
  };
  const indexedDBMock = {
    open() {
      const request: FakeRequest<typeof db> = {
        result: db,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
      queueMicrotask(() => {
        request.onupgradeneeded?.(new Event("upgradeneeded"));
        request.onsuccess?.(new Event("success"));
      });
      return request as unknown as IDBOpenDBRequest;
    },
  };

  Object.defineProperty(window, "indexedDB", {
    value: indexedDBMock,
    configurable: true,
  });
  Object.defineProperty(globalThis, "indexedDB", {
    value: indexedDBMock,
    configurable: true,
  });
}

async function createUserDataKey() {
  return crypto.subtle.importKey(
    "raw",
    new Uint8Array(32),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

describe("user data key cache", () => {
  beforeEach(() => {
    installFakeIndexedDB();
  });

  it("stores non-extractable CryptoKeys per user and clears them", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const key = await createUserDataKey();

    await saveCachedUserDataKey(userId, key);
    const cachedKey = await loadCachedUserDataKey(userId);

    expect(cachedKey).toBe(key);
    expect(cachedKey?.extractable).toBe(false);
    expect(cachedKey?.usages).toEqual(["encrypt", "decrypt"]);

    await clearCachedUserDataKey(userId);

    await expect(loadCachedUserDataKey(userId)).resolves.toBeNull();
  });

  it("falls back quietly when IndexedDB is unavailable", async () => {
    Object.defineProperty(window, "indexedDB", {
      value: undefined,
      configurable: true,
    });

    await expect(loadCachedUserDataKey("user")).resolves.toBeNull();
    await expect(saveCachedUserDataKey("user", await createUserDataKey())).resolves.toBeUndefined();
    await expect(clearCachedUserDataKey("user")).resolves.toBeUndefined();
  });
});
