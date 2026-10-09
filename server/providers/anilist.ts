import { z } from "zod";
import type { AnimeDetail, AnimeSummary } from "../../shared/contracts.js";
import { getRuntimeEnv } from "../runtime.js";
import type { SeasonInfo } from "../season.js";
import { formatSeasonLabel } from "../season.js";
import { fetchWithTimeout, nonEmpty, stripHtml } from "../utils.js";

const MediaSchema = z
  .object({
    id: z.number().int(),
    title: z
      .object({
        romaji: z.string().nullish(),
        english: z.string().nullish(),
        native: z.string().nullish(),
        userPreferred: z.string().nullish(),
      })
      .nullish(),
    coverImage: z
      .object({
        extraLarge: z.string().nullish(),
        large: z.string().nullish(),
        medium: z.string().nullish(),
      })
      .nullish(),
    bannerImage: z.string().nullish(),
    description: z.string().nullish(),
    genres: z.array(z.string()).nullish(),
    averageScore: z.number().nullish(),
    episodes: z.number().nullish(),
    status: z.string().nullish(),
    siteUrl: z.string().nullish(),
    nextAiringEpisode: z
      .object({
        episode: z.number().int(),
        airingAt: z.number().int(),
      })
      .nullish(),
    trailer: z
      .object({
        id: z.string().nullish(),
        site: z.string().nullish(),
      })
      .nullish(),
    externalLinks: z
      .array(z.object({ site: z.string().nullish(), url: z.string().nullish() }).passthrough())
      .nullish(),
    studios: z
      .object({ nodes: z.array(z.object({ name: z.string() }).passthrough()).nullish() })
      .nullish(),
    tags: z.array(z.object({ name: z.string() }).passthrough()).nullish(),
  })
  .passthrough();

const PageResponseSchema = z.object({
  data: z
    .object({
      Page: z.object({ media: z.array(MediaSchema) }).nullish(),
    })
    .nullish(),
  errors: z.array(z.unknown()).nullish(),
});

const DetailResponseSchema = z.object({
  data: z.object({ Media: MediaSchema.nullish() }).nullish(),
  errors: z.array(z.unknown()).nullish(),
});

const MEDIA_FIELDS = `
  id
  title { romaji english native userPreferred }
  coverImage { extraLarge large medium }
  bannerImage
  description(asHtml: false)
  genres
  averageScore
  episodes
  status
  siteUrl
  nextAiringEpisode { episode airingAt }
  trailer { id site }
  externalLinks { site url }
  studios(isMain: true) { nodes { name } }
  tags { name }
`;

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] as const;

function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case "RELEASING":
      return "连载中";
    case "FINISHED":
      return "已完结";
    case "NOT_YET_RELEASED":
      return "未开播";
    case "CANCELLED":
      return "已取消";
    case "HIATUS":
      return "停更";
    default:
      return "动画";
  }
}

function airDayFromTimestamp(timestamp: number | undefined): string | undefined {
  if (!timestamp) return undefined;
  const tokyo = new Date((timestamp + 9 * 60 * 60) * 1000);
  return WEEKDAYS[tokyo.getUTCDay()];
}

function normalizeMedia(media: z.infer<typeof MediaSchema>): AnimeDetail {
  const title = media.title ?? {};
  const original =
    nonEmpty(title.english) ?? nonEmpty(title.romaji) ?? nonEmpty(title.native) ?? "Unknown title";
  const cover = media.coverImage?.extraLarge ?? media.coverImage?.large ?? media.coverImage?.medium ?? "";
  const externalLinks = (media.externalLinks ?? [])
    .filter((link): link is { site: string; url: string } => Boolean(link.site && link.url))
    .slice(0, 6)
    .map((link) => ({ label: link.site, url: link.url }));
  const extraTags = (media.tags ?? []).map((tag) => tag.name).slice(0, 10);
  const genres = media.genres ?? [];
  const trailerUrl =
    media.trailer?.site === "youtube" && media.trailer.id
      ? `https://www.youtube.com/watch?v=${media.trailer.id}`
      : undefined;

  return {
    key: `anilist:${media.id}`,
    source: "anilist",
    title: { original, romaji: nonEmpty(title.romaji) },
    cover,
    banner: media.bannerImage ?? (cover || undefined),
    synopsis: media.description ? stripHtml(media.description) : undefined,
    genres,
    score: media.averageScore ?? undefined,
    episodes: media.episodes ?? undefined,
    status: statusLabel(media.status),
    airDay: airDayFromTimestamp(media.nextAiringEpisode?.airingAt),
    siteUrl: media.siteUrl ?? `https://anilist.co/anime/${media.id}`,
    studios: (media.studios?.nodes ?? []).map((studio) => studio.name),
    tags: extraTags.length > 0 ? extraTags : genres,
    externalLinks,
    trailerUrl,
    sourceUpdatedAt: new Date().toISOString(),
  };
}

function toSummary(detail: AnimeDetail): AnimeSummary {
  return {
    key: detail.key,
    source: detail.source,
    title: detail.title,
    cover: detail.cover,
    banner: detail.banner,
    synopsis: detail.synopsis,
    genres: detail.genres,
    score: detail.score,
    episodes: detail.episodes,
    status: detail.status,
    airDay: detail.airDay,
    siteUrl: detail.siteUrl,
  };
}

async function fetchAniList<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetchWithTimeout("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": getRuntimeEnv().ANILIST_USER_AGENT,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`AniList 请求失败: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchAniListSeason(info: SeasonInfo): Promise<AnimeSummary[]> {
  const query = `
    query Season($page: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: 50) {
        media(season: $season, seasonYear: $seasonYear, type: ANIME, isAdult: false, sort: [POPULARITY_DESC]) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const payload = await fetchAniList<unknown>(query, {
    page: 1,
    season: info.season,
    seasonYear: info.year,
  });
  const parsed = PageResponseSchema.parse(payload);
  if (parsed.errors?.length) throw new Error("AniList 返回查询错误");
  const media = parsed.data?.Page?.media ?? [];
  if (media.length === 0) throw new Error(`AniList 没有 ${formatSeasonLabel(info.season, info.year)} 数据`);
  return media.map((item) => toSummary(normalizeMedia(item)));
}

export async function fetchAniListDetail(id: number): Promise<AnimeDetail> {
  const query = `
    query Detail($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
      }
    }
  `;
  const payload = await fetchAniList<unknown>(query, { id });
  const parsed = DetailResponseSchema.parse(payload);
  if (parsed.errors?.length) throw new Error("AniList 返回查询错误");
  const media = parsed.data?.Media;
  if (!media) throw new Error("AniList 未找到该番剧");
  return normalizeMedia(media);
}