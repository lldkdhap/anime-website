import type { AnimeSummary } from "../../shared/contracts";

const RECENT_KEY = "anime-radar:recent";
const RECENT_LIMIT = 5;

export function readRecentKeys(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export function rememberRecentKey(key: string): void {
  try {
    const next = [key, ...readRecentKeys().filter((value) => value !== key)].slice(0, RECENT_LIMIT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage can be unavailable in private mode; drawing should still work.
  }
}

export function pickRandomAnime(
  items: AnimeSummary[],
  random: () => number = Math.random,
  recentKeys: string[] = readRecentKeys(),
): AnimeSummary | undefined {
  if (items.length === 0) return undefined;
  const fresh = items.filter((item) => !recentKeys.includes(item.key));
  const pool = fresh.length > 0 ? fresh : items;
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
  return pool[index];
}