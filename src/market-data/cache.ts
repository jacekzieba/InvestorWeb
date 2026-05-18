import type { MarketDataCacheEntry } from "@/market-data/types";

const cache = new Map<string, MarketDataCacheEntry<unknown>>();

export function getCachedMarketData<TValue>(key: string): MarketDataCacheEntry<TValue> | null {
  const entry = cache.get(key) as MarketDataCacheEntry<TValue> | undefined;
  if (!entry) return null;

  if (new Date(entry.expiresAt).getTime() <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry;
}

export function setCachedMarketData<TValue>(
  key: string,
  value: TValue,
  ttlMs: number,
): MarketDataCacheEntry<TValue> {
  const now = new Date();
  const entry = {
    value,
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  } satisfies MarketDataCacheEntry<TValue>;

  cache.set(key, entry as MarketDataCacheEntry<unknown>);
  return entry;
}

export function clearMarketDataCache() {
  cache.clear();
}
