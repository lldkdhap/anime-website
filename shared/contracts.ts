import { z } from "zod";

export const AnimeSourceSchema = z.enum(["bangumi", "anilist"]);
export const SeasonNameSchema = z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]);

export const AnimeTitleSchema = z.object({
  zh: z.string().optional(),
  original: z.string().min(1),
  romaji: z.string().optional(),
});

export const ExternalLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const AnimeSummarySchema = z.object({
  key: z.string().min(1),
  source: AnimeSourceSchema,
  title: AnimeTitleSchema,
  cover: z.string().default(""),
  banner: z.string().optional(),
  synopsis: z.string().optional(),
  genres: z.array(z.string()).default([]),
  score: z.number().optional(),
  episodes: z.number().optional(),
  status: z.string().default("未知"),
  airDay: z.string().optional(),
  siteUrl: z.string().optional(),
});

export const AnimeDetailSchema = AnimeSummarySchema.extend({
  studios: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  externalLinks: z.array(ExternalLinkSchema).default([]),
  trailerUrl: z.string().optional(),
  sourceUpdatedAt: z.string().min(1),
});

export const NewsItemSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().default(""),
  url: z.string().url(),
  image: z.string().optional(),
  publishedAt: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export const SeasonResponseSchema = z.object({
  season: SeasonNameSchema,
  year: z.number().int(),
  label: z.string().min(1),
  updatedAt: z.string().min(1),
  source: AnimeSourceSchema,
  degraded: z.boolean().optional(),
  items: z.array(AnimeSummarySchema),
});

export const NewsResponseSchema = z.object({
  updatedAt: z.string().min(1),
  degraded: z.boolean().optional(),
  sources: z.array(z.string()),
  items: z.array(NewsItemSchema),
});

export const ApiErrorSchema = z.object({
  error: z.string().min(1),
  message: z.string().min(1),
});

export type AnimeSource = z.infer<typeof AnimeSourceSchema>;
export type SeasonName = z.infer<typeof SeasonNameSchema>;
export type AnimeTitle = z.infer<typeof AnimeTitleSchema>;
export type AnimeSummary = z.infer<typeof AnimeSummarySchema>;
export type AnimeDetail = z.infer<typeof AnimeDetailSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;
export type SeasonResponse = z.infer<typeof SeasonResponseSchema>;
export type NewsResponse = z.infer<typeof NewsResponseSchema>;
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;