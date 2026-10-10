import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index.js";
import { clearServerCache } from "../server/cache.js";

const bangumiCalendar = JSON.stringify([
  {
    weekday: { cn: "星期五" },
    items: [
      { id: 1, name: "Test Anime", name_cn: "测试动画", images: { large: "https://example.com/1.jpg" }, rating: { score: 8.2 } },
      { id: 2, name: "Second Anime", name_cn: "第二部", images: { large: "https://example.com/2.jpg" } },
      { id: 3, name: "Third Anime", name_cn: "第三部", images: { large: "https://example.com/3.jpg" } },
    ],
  },
]);

interface TestEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  BANGUMI_USER_AGENT?: string;
  ANILIST_USER_AGENT?: string;
}

function createEnv(assetsFetch = vi.fn(async () => new Response("asset", { status: 200 }))): TestEnv {
  return { ASSETS: { fetch: assetsFetch } };
}

afterEach(() => {
  clearServerCache();
  vi.unstubAllGlobals();
});

describe("cloudflare worker", () => {
  it("routes /api/season through the shared API core", async () => {
    vi.stubGlobal("fetch", async () => new Response(bangumiCalendar, { status: 200 }));
    const response = await worker.fetch(new Request("https://example.com/api/season"), createEnv());
    expect(response.status).toBe(200);
    const body = (await response.json()) as { source: string; items: unknown[] };
    expect(body.source).toBe("bangumi");
    expect(body.items).toHaveLength(3);
  });

  it("injects runtime environment variables", async () => {
    let capturedUserAgent = "";
    vi.stubGlobal("fetch", async (_input: string | URL | Request, init?: RequestInit) => {
      capturedUserAgent = String((init?.headers as Record<string, string> | undefined)?.["User-Agent"] ?? "");
      return new Response(bangumiCalendar, { status: 200 });
    });
    const env = createEnv();
    env.BANGUMI_USER_AGENT = "custom-agent/1.0 (test)";
    await worker.fetch(new Request("https://example.com/api/season"), env);
    expect(capturedUserAgent).toBe("custom-agent/1.0 (test)");
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const response = await worker.fetch(new Request("https://example.com/api/unknown"), createEnv());
    expect(response.status).toBe(404);
    expect(((await response.json()) as { error: string }).error).toBe("not_found");
  });

  it("rejects non-GET API requests", async () => {
    const response = await worker.fetch(
      new Request("https://example.com/api/season", { method: "POST" }),
      createEnv(),
    );
    expect(response.status).toBe(405);
  });

  it("delegates non-API routes to the ASSETS binding", async () => {
    const assetsFetch = vi.fn(async () => new Response("spa-shell", { status: 200 }));
    const env = createEnv(assetsFetch);
    const response = await worker.fetch(new Request("https://example.com/news"), env);
    expect(await response.text()).toBe("spa-shell");
    expect(assetsFetch).toHaveBeenCalledTimes(1);
  });
});