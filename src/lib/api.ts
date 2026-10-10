import {
  AnimeDetailSchema,
  ApiErrorSchema,
  NewsResponseSchema,
  SeasonResponseSchema,
  type AnimeDetail,
  type NewsResponse,
  type SeasonResponse,
} from "../../shared/contracts";
import { fetchAniListDetail } from "./anilist";

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

interface SchemaLike<T> {
  parse: (value: unknown) => T;
}

async function request<T>(url: string, schema: SchemaLike<T>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(payload);
    throw new ApiRequestError(error.success ? error.data.message : `请求失败 (${response.status})`, response.status);
  }
  return schema.parse(payload);
}

export const api = {
  season: (): Promise<SeasonResponse> => request("/api/season", SeasonResponseSchema),
  news: (limit = 24): Promise<NewsResponse> => request(`/api/news?limit=${limit}`, NewsResponseSchema),
  anime: async (source: string, id: string, signal?: AbortSignal): Promise<AnimeDetail> => {
    if (source === "anilist") {
      try {
        return await fetchAniListDetail(Number.parseInt(id, 10), signal);
      } catch (directError) {
        console.warn("Browser AniList detail failed, falling back to Worker:", directError);
        return request(`/api/anime/anilist/${id}`, AnimeDetailSchema, signal);
      }
    }
    return request(`/api/anime/${source}/${id}`, AnimeDetailSchema, signal);
  },
};