import { z } from "zod";
import type { AnimeDetail, AnimeSummary } from "../../shared/contracts.js";
import { fetchJson, nonEmpty, stripHtml } from "../utils.js";

const ImagesSchema = z
  .object({
    large: z.string().nullish(),
    common: z.string().nullish(),
    medium: z.string().nullish(),
    grid: z.string().nullish(),
  })
  .partial();

const RatingSchema = z
  .object({
    score: z.number().nullish(),
    total: z.number().nullish(),
    rank: z.number().nullish(),
  })
  .partial();

const CalendarItemSchema = z
  .object({
    id: z.coerce.number().int(),
    name: z.string(),
    name_cn: z.string().nullish(),
    url: z.string().nullish(),
    images: ImagesSchema.nullish(),
    air_date: z.string().nullish(),
    air_weekday: z.union([z.number(), z.string()]).nullish(),
    eps: z.number().nullish(),
    rating: RatingSchema.nullish(),
  })
  .passthrough();

const CalendarResponseSchema = z.array(
  z.object({
    weekday: z.object({
      cn: z.string().nullish(),
      en: z.string().nullish(),
      ja: z.string().nullish(),
      id: z.union([z.number(), z.string()]).nullish(),
    }),
    items: z.array(CalendarItemSchema),
  }),
);

const InfoboxItemSchema = z
  .object({
    key: z.string(),
    value: z.unknown(),
  })
  .passthrough();

const SubjectSchema = z
  .object({
    id: z.coerce.number().int(),
    name: z.string(),
    name_cn: z.string().nullish(),
    summary: z.string().nullish(),
    date: z.string().nullish(),
    platform: z.string().nullish(),
    eps: z.number().nullish(),
    total_episodes: z.number().nullish(),
    images: ImagesSchema.nullish(),
    rating: RatingSchema.nullish(),
    tags: z
      .array(z.object({ name: z.string(), count: z.number().nullish() }).passthrough())
      .nullish(),
    infobox: z.array(InfoboxItemSchema).nullish(),
  })
  .passthrough();

function pickCover(images: z.infer<typeof ImagesSchema> | null | undefined): string {
  return images?.large ?? images?.common ?? images?.medium ?? images?.grid ?? "";
}

function infoboxToString(value: unknown): string | undefined {
  if (typeof value === "string") return nonEmpty(value);
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => {
        if (typeof entry === "object" && entry !== null && "v" in entry) {
          const raw = (entry as { v?: unknown }).v;
          return typeof raw === "string" ? raw : "";
        }
        return typeof entry === "string" ? entry : "";
      })
      .filter(Boolean);
    return parts.length > 0 ? parts.join("、") : undefined;
  }
  return undefined;
}

function normalizeSummary(item: z.infer<typeof CalendarItemSchema>, weekday: string): AnimeSummary {
  const zh = nonEmpty(item.name_cn);
  const cover = pickCover(item.images);
  const score = item.rating?.score ?? item.rating?.total;
  return {
    key: `bangumi:${item.id}`,
    source: "bangumi",
    title: { zh, original: item.name },
    cover,
    banner: cover || undefined,
    genres: [],
    score: score && score > 0 ? score : undefined,
    episodes: item.eps ?? undefined,
    status: "连载中",
    airDay: weekday,
    siteUrl: item.url ?? `https://bgm.tv/subject/${item.id}`,
  };
}

export async function fetchBangumiSeason(): Promise<AnimeSummary[]> {
  const payload = await fetchJson<unknown>("https://api.bgm.tv/calendar");
  const calendar = CalendarResponseSchema.parse(payload);
  const items: AnimeSummary[] = [];
  for (const day of calendar) {
    const weekday = nonEmpty(day.weekday.cn) ?? nonEmpty(day.weekday.ja) ?? "每日";
    for (const item of day.items) {
      if (!item.name) continue;
      items.push(normalizeSummary(item, weekday));
    }
  }
  return items;
}

export async function fetchBangumiDetail(id: number): Promise<AnimeDetail> {
  const payload = await fetchJson<unknown>(`https://api.bgm.tv/v0/subjects/${id}`);
  const subject = SubjectSchema.parse(payload);
  const cover = pickCover(subject.images);
  const tags = [...(subject.tags ?? [])]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .map((tag) => tag.name)
    .slice(0, 10);
  const infobox = subject.infobox ?? [];
  const studioKeys = ["动画制作", "制作", "製作"];
  const studios = infobox
    .filter((entry) => studioKeys.some((key) => entry.key.includes(key)))
    .map((entry) => infoboxToString(entry.value))
    .filter((value): value is string => Boolean(value));
  const officialSite = infobox.find((entry) => entry.key.includes("官方网站"));
  const officialUrl = officialSite ? infoboxToString(officialSite.value) : undefined;
  const externalLinks = officialUrl && /^https?:\/\//.test(officialUrl)
    ? [{ label: "官方网站", url: officialUrl }]
    : [];

  return {
    key: `bangumi:${subject.id}`,
    source: "bangumi",
    title: { zh: nonEmpty(subject.name_cn), original: subject.name },
    cover,
    banner: cover || undefined,
    synopsis: subject.summary ? stripHtml(subject.summary) : undefined,
    genres: tags.slice(0, 5),
    score: subject.rating?.score && subject.rating.score > 0 ? subject.rating.score : undefined,
    episodes: subject.eps ?? subject.total_episodes ?? undefined,
    status: subject.platform ?? "动画",
    siteUrl: `https://bgm.tv/subject/${subject.id}`,
    studios,
    tags,
    externalLinks,
    sourceUpdatedAt: new Date().toISOString(),
  };
}