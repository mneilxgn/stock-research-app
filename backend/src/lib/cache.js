/**
 * Simple in-memory TTL cache.
 */
const store = new Map();

let hits = 0;
let misses = 0;

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) { misses++; return null; }
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    misses++;
    return null;
  }
  hits++;
  return entry.data;
}

export function cacheSet(key, data, ttlSeconds) {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function cacheStats() {
  return { size: store.size, hits, misses };
}
