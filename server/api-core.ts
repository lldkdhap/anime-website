import { ApiErrorSchema } from "../shared/contracts.js";
import type { AnimeDetail, AnimeSource, NewsResponse, SeasonResponse } from "../shared/contracts.js";
import { cachedWithFallback } from "./cache.js";
import { fetchAniListDetail, fetchAniListSeason } from "./providers/anilist.js";
import { fetchBangumiDetail, fetchBangumiSeason } from "./providers/bangumi.js";
import { fetchNews } from "./providers/news.js";
import { getCurrentSeason } from "./season.js";

export interface ApiResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

const SEASON_TTL = 6 * 60 * 60 * 1000;
const DETAIL_TTL = 24 * 60 * 60 * 1000;
const NEWS_TTL = 15 * 60 * 1000;

function jsonHeaders(cacheControl: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl,
    ...extra,
  };
}

function apiError(status: number, error: string, message: string): ApiResult {
  return {
    status,
    headers: jsonHeaders("no-store"),
    body: ApiErrorSchema.parse({ error, message }),
  };
}

export async function handleSeason(): Promise<ApiResult> {
  const info = getCurrentSeason();
  try {
    const result = await cachedWithFallback(`season:${info.year}:${info.season}`, SEASON_TTL, async () => {
      try {
        const items = await fetchBangumiSeason();
        if (items.length < 3) throw new Error("Bangumi 当季条目不足");
        return { source: "bangumi" as const, items };
      } catch (error) {
        console.warn("Bangumi season failed, falling back to AniList:", error);
        const items = await fetchAniListSeason(info);
        return { source: "anilist" as const, items };
      }
    });

    const body: SeasonResponse = {
      season: info.season,
      year: info.year,
      label: info.label,
      updatedAt: new Date().toISOString(),
      source: result.value.source,
      degraded: result.stale || result.value.source !== "bangumi",
      items: result.value.items,
    };

    return {
      status: 200,
      headers: jsonHeaders("public, s-maxage=21600, stale-while-revalidate=86400", {
        "X-Data-Source": result.value.source,
        "X-Cache": result.stale ? "stale" : "fresh",
      }),
      body,
    };
  } catch (error) {
    console.error("Season handler failed:", error);
    return apiError(502, "season_unavailable", "当季番剧数据暂时不可用，请稍后重试。");
  }
}

export async function handleAnime(sourceValue: string, idValue: string): Promise<ApiResult> {
  if ((sourceValue !== "bangumi" && sourceValue !== "anilist") || !/^\d+$/.test(idValue)) {
    return apiError(400, "invalid_anime_id", "番剧来源或编号无效。");
  }

  const source: AnimeSource = sourceValue;
  const id = Number.parseInt(idValue, 10);

  try {
    const result = await cachedWithFallback<AnimeDetail>(`anime:${source}:${id}`, DETAIL_TTL, () =>
      source === "bangumi" ? fetchBangumiDetail(id) : fetchAniListDetail(id),
    );

    return {
      status: 200,
      headers: jsonHeaders("public, s-maxage=86400, stale-while-revalidate=604800", {
        "X-Data-Source": source,
        "X-Cache": result.stale ? "stale" : "fresh",
      }),
      body: result.value,
    };
  } catch (error) {
    console.error("Anime detail handler failed:", error);
    return apiError(502, "anime_unavailable", "番剧详情暂时不可用，请稍后重试。");
  }
}

export async function handleNews(limitValue: number): Promise<ApiResult> {
  const limit = Number.isFinite(limitValue) ? Math.min(48, Math.max(6, Math.trunc(limitValue))) : 24;
  try {
    const result = await cachedWithFallback(`news:${limit}`, NEWS_TTL, async () => {
      const news = await fetchNews(limit);
      if (news.items.length === 0) throw new Error("所有新闻源都不可用");
      return news;
    });

    const body: NewsResponse = {
      updatedAt: new Date().toISOString(),
      degraded: result.stale || result.value.degraded,
      sources: result.value.sources,
      items: result.value.items,
    };

    return {
      status: 200,
      headers: jsonHeaders("public, s-maxage=900, stale-while-revalidate=86400", {
        "X-Cache": result.stale ? "stale" : "fresh",
      }),
      body,
    };
  } catch (error) {
    console.error("News handler failed:", error);
    return apiError(502, "news_unavailable", "资讯暂时不可用，请稍后重试。");
  }
}