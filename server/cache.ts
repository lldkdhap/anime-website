interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const store = new Map<string, CacheEntry>();

export interface CachedValue<T> {
  value: T;
  stale: boolean;
}

export async function cachedWithFallback<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<CachedValue<T>> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return { value: hit.value as T, stale: false };
  }

  try {
    const value = await loader();
    store.set(key, { expiresAt: now + ttlMs, value });
    return { value, stale: false };
  } catch (error) {
    if (hit) {
      return { value: hit.value as T, stale: true };
    }
    throw error;
  }
}

export function clearServerCache(): void {
  store.clear();
}