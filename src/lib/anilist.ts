import { z } from "zod";
import type { AnimeDetail } from "../../shared/contracts";

export const AniListSearchItemSchema = z
  .object({
    id: z.number().int(),
    title: z
      .object({
        romaji: z.string().nullish(),
        english: z.string().nullish(),
        native: z.string().nullish(),
      })
      .nullish(),
    coverImage: z
      .object({
        large: z.string().nullish(),
        medium: z.string().nullish(),
      })
      .nullish(),
    averageScore: z.number().nullish(),
    genres: z.array(z.string()).nullish(),
    status: z.string().nullish(),
    episodes: z.number().nullish(),
  })
  .passthrough();

const AniListDetailMediaSchema = z
  .object({
    id: z.number().int(),
    title: z
      .object({
        romaji: z.string().nullish(),
        english: z.string().nullish(),
        native: z.string().nullish(),
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

const AniListErrorSchema = z.object({ message: z.string().optional() }).passthrough();

const AniListSearchResponseSchema = z.object({
  data: z
    .object({
      Page: z
        .object({
          media: z.array(AniListSearchItemSchema).nullish(),
        })
        .nullish(),
    })
    .nullish(),
  errors: z.array(AniListErrorSchema).nullish(),
});

const AniListDetailResponseSchema = z.object({
  data: z
    .object({
      Media: AniListDetailMediaSchema.nullish(),
    })
    .nullish(),
  errors: z.array(AniListErrorSchema).nullish(),
});

export type AniListSearchItem = z.infer<typeof AniListSearchItemSchema>;

const SEARCH_QUERY = `
  query SearchAnime($search: String) {
    Page(page: 1, perPage: 8) {
      media(search: $search, type: ANIME, isAdult: false, sort: [POPULARITY_DESC]) {
        id
        title { romaji english native }
        coverImage { large medium }
        averageScore
        genres
        status
        episodes
      }
    }
  }
`;

const DETAIL_QUERY = `
  query AnimeDetail($id: Int) {
    Media(id: $id, type: ANIME, isAdult: false) {
      id
      title { romaji english native }
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
    }
  }
`;

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] as const;

function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function stripHtml(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const plain = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return plain || undefined;
}

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

async function postAniList(query: string, variables: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`AniList 请求失败: ${response.status}`);
  }

  return response.json();
}

export async function searchAniList(query: string, signal?: AbortSignal): Promise<AniListSearchItem[]> {
  const search = query.trim();
  if (!search) return [];

  const parsed = AniListSearchResponseSchema.parse(await postAniList(SEARCH_QUERY, { search }, signal));
  if (parsed.errors?.length) {
    throw new Error(parsed.errors[0]?.message ?? "AniList 返回搜索错误");
  }
  return parsed.data?.Page?.media ?? [];
}

export async function fetchAniListDetail(id: number, signal?: AbortSignal): Promise<AnimeDetail> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效的 AniList 番剧编号。");
  }

  const parsed = AniListDetailResponseSchema.parse(await postAniList(DETAIL_QUERY, { id }, signal));
  if (parsed.errors?.length) {
    throw new Error(parsed.errors[0]?.message ?? "AniList 返回详情错误");
  }

  const media = parsed.data?.Media;
  if (!media) throw new Error("AniList 未找到该番剧。");

  const title = media.title ?? {};
  const original = nonEmpty(title.english) ?? nonEmpty(title.romaji) ?? nonEmpty(title.native) ?? "Unknown title";
  const cover = media.coverImage?.extraLarge ?? media.coverImage?.large ?? media.coverImage?.medium ?? "";
  const genres = media.genres ?? [];
  const tags = (media.tags ?? []).map((tag) => tag.name).slice(0, 10);
  const externalLinks = (media.externalLinks ?? [])
    .filter((link): link is { site: string; url: string } => Boolean(link.site && link.url))
    .slice(0, 6)
    .map((link) => ({ label: link.site, url: link.url }));
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
    synopsis: stripHtml(media.description),
    genres,
    score: media.averageScore ?? undefined,
    episodes: media.episodes ?? undefined,
    status: statusLabel(media.status),
    airDay: airDayFromTimestamp(media.nextAiringEpisode?.airingAt),
    siteUrl: media.siteUrl ?? `https://anilist.co/anime/${media.id}`,
    studios: (media.studios?.nodes ?? []).map((studio) => studio.name),
    tags: tags.length > 0 ? tags : genres,
    externalLinks,
    trailerUrl,
    sourceUpdatedAt: new Date().toISOString(),
  };
}