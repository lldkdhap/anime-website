import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import type { ApiResult } from "./server/api-core.js";

interface LocalApiModule {
  handleSeason: () => Promise<ApiResult>;
  handleNews: (limit: number) => Promise<ApiResult>;
  handleAnime: (source: string, id: string) => Promise<ApiResult>;
}

function localApiPlugin(): Plugin {
  return {
    name: "anime-radar-local-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) {
          next();
          return;
        }

        if (request.method !== "GET") {
          sendJson(response, { status: 405, headers: {}, body: { error: "method_not_allowed", message: "仅支持 GET 请求。" } });
          return;
        }

        try {
          const runtime = (await server.ssrLoadModule("/server/runtime.ts")) as unknown as {
            configureRuntimeEnv: (env: Record<string, string | undefined>) => void;
          };
          runtime.configureRuntimeEnv(process.env);
          const api = (await server.ssrLoadModule("/server/api-core.ts")) as unknown as LocalApiModule;
          sendJson(response, await dispatchLocalApi(api, url));
        } catch (error) {
          server.config.logger.error(String(error));
          sendJson(response, {
            status: 500,
            headers: { "Cache-Control": "no-store" },
            body: { error: "local_api_failed", message: "本地 API 执行失败，请查看终端日志。" },
          });
        }
      });
    },
  };
}

async function dispatchLocalApi(api: LocalApiModule, url: URL): Promise<ApiResult> {
  if (url.pathname === "/api/season") return api.handleSeason();
  if (url.pathname === "/api/news") {
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "24", 10);
    return api.handleNews(Number.isFinite(limit) ? limit : 24);
  }
  const match = url.pathname.match(/^\/api\/anime\/(bangumi|anilist)\/(\d+)$/);
  if (match?.[1] && match[2]) return api.handleAnime(match[1], match[2]);
  return { status: 404, headers: { "Cache-Control": "no-store" }, body: { error: "not_found", message: "API 路由不存在。" } };
}

function sendJson(response: ServerResponse<IncomingMessage>, result: ApiResult): void {
  response.statusCode = result.status;
  for (const [key, value] of Object.entries(result.headers)) response.setHeader(key, value);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(result.body));
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
});