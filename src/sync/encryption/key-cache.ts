const DB_NAME = "investor-web-key-cache";
const STORE_NAME = "user-data-keys";
const DB_VERSION = 1;

type CachedUserDataKey = {
  userId: string;
  key: CryptoKey;
  updatedAt: string;
};

function canUseKeyCache() {
  return typeof window !== "undefined" && Boolean(window.indexedDB);
}

function openKeyCache() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<TValue>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<TValue>,
) {
  const db = await openKeyCache();
  try {
    return await new Promise<TValue>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function loadCachedUserDataKey(userId: string) {
  if (!canUseKeyCache()) {
    return null;
  }

  const cached = await withStore<CachedUserDataKey | undefined>(
    "readonly",
    (store) => store.get(userId),
  );

  return cached?.key ?? null;
}

export async function saveCachedUserDataKey(userId: string, key: CryptoKey) {
  if (!canUseKeyCache()) {
    return;
  }

  await withStore<IDBValidKey>("readwrite", (store) =>
    store.put({
      userId,
      key,
      updatedAt: new Date().toISOString(),
    } satisfies CachedUserDataKey),
  );
}

export async function clearCachedUserDataKey(userId: string) {
  if (!canUseKeyCache()) {
    return;
  }

  await withStore<undefined>("readwrite", (store) => store.delete(userId));
}
