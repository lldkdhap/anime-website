import { getRuntimeEnv } from "./runtime.js";

const entityMap: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
};

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name: string) => entityMap[name.toLowerCase()] ?? match);
}

export function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h\d)>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: string, maxLength: number): string {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function parseDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp).toISOString();
}

export function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const environment = getRuntimeEnv();
  const response = await fetchWithTimeout(url, {
    ...init,
    headers: {
      "User-Agent": environment.BANGUMI_USER_AGENT,
      Accept: "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`上游请求失败: ${response.status} ${url}`);
  }
  return (await response.json()) as T;
}

export async function fetchText(url: string, init: RequestInit = {}): Promise<string> {
  const environment = getRuntimeEnv();
  const response = await fetchWithTimeout(url, {
    ...init,
    headers: {
      "User-Agent": environment.BANGUMI_USER_AGENT,
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`上游请求失败: ${response.status} ${url}`);
  }
  return response.text();
}