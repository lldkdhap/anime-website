import { handleAnime, handleNews, handleSeason, type ApiResult } from "../server/api-core.js";
import { configureRuntimeEnv, type RuntimeEnv } from "../server/runtime.js";

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface WorkerEnv extends RuntimeEnv {
  ASSETS: Fetcher;
}

function jsonResponse(result: ApiResult): Response {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: result.headers,
  });
}

function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: "method_not_allowed", message: "仅支持 GET 请求。" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Allow: "GET",
      "Cache-Control": "no-store",
    },
  });
}

function apiNotFound(): Response {
  return new Response(JSON.stringify({ error: "not_found", message: "API 路由不存在。" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function handleApi(request: Request, url: URL): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed();
  if (url.pathname === "/api/season") return jsonResponse(await handleSeason());
  if (url.pathname === "/api/news") {
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "24", 10);
    return jsonResponse(await handleNews(Number.isFinite(limit) ? limit : 24));
  }
  const match = url.pathname.match(/^\/api\/anime\/(bangumi|anilist)\/(\d+)$/);
  if (match?.[1] && match[2]) return jsonResponse(await handleAnime(match[1], match[2]));
  return apiNotFound();
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    configureRuntimeEnv(env);
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, url);
    }
    return env.ASSETS.fetch(request);
  },
};