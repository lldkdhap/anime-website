import type { AnimeTitle } from "../../shared/contracts";

export function displayTitle(title: AnimeTitle): string {
  return title.zh ?? title.original ?? title.romaji ?? "未知作品";
}

export function secondaryTitle(title: AnimeTitle): string | undefined {
  const secondary = title.original ?? title.romaji;
  if (!secondary) return undefined;
  return secondary === title.zh ? undefined : secondary;
}

export function formatDateTime(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "日期未知";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date(timestamp));
}

export function formatScore(score: number | undefined): string {
  if (score === undefined || score <= 0) return "暂无评分";
  const normalized = score > 10 ? score / 10 : score;
  return normalized.toFixed(1);
}

export function formatEpisodes(value: number | undefined): string {
  return value && value > 0 ? `${value} 集` : "集数未定";
}