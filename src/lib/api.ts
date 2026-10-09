import {
  AnimeDetailSchema,
  ApiErrorSchema,
  NewsResponseSchema,
  SeasonResponseSchema,
  type AnimeDetail,
  type NewsResponse,
  type SeasonResponse,
} from "../../shared/contracts";

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

async function request<T>(url: string, schema: SchemaLike<T>): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
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
  anime: (source: string, id: string): Promise<AnimeDetail> => request(`/api/anime/${source}/${id}`, AnimeDetailSchema),
};