import { afterEach, describe, expect, it, vi } from "vitest";
import { handleSeason } from "./api-core.js";
import { clearServerCache } from "./cache.js";

const bangumiCalendar = JSON.stringify([
  {
    weekday: { cn: "星期五", en: "Friday", ja: "金曜日", id: 5 },
    items: [
      { id: 1, name: "Test Anime", name_cn: "测试动画", images: { large: "https://example.com/1.jpg" }, rating: { score: 8.2 } },
      { id: 2, name: "Second Anime", name_cn: "第二部", images: { large: "https://example.com/2.jpg" } },
      { id: 3, name: "Third Anime", name_cn: "第三部", images: { large: "https://example.com/3.jpg" } },
    ],
  },
]);

const anilistPage = JSON.stringify({
  data: {
    Page: {
      media: [
        {
          id: 10,
          title: { romaji: "Fallback Anime", english: "Fallback Anime", native: "フォールバック" },
          coverImage: { extraLarge: "https://example.com/f.jpg" },
          genres: ["Action"],
          status: "RELEASING",
          siteUrl: "https://anilist.co/anime/10",
        },
      ],
    },
  },
});

afterEach(() => {
  clearServerCache();
  vi.unstubAllGlobals();
});

describe("handleSeason", () => {
  it("uses Bangumi as the primary source", async () => {
    vi.stubGlobal("fetch", async () => new Response(bangumiCalendar, { status: 200 }));
    const result = await handleSeason();
    expect(result.status).toBe(200);
    expect((result.body as { source: string; items: unknown[] }).source).toBe("bangumi");
    expect((result.body as { items: unknown[] }).items).toHaveLength(3);
  });

  it("falls back to AniList when Bangumi fails", async () => {
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("api.bgm.tv")) return new Response("boom", { status: 500 });
      return new Response(anilistPage, { status: 200 });
    });
    const result = await handleSeason();
    expect(result.status).toBe(200);
    expect((result.body as { source: string }).source).toBe("anilist");
  });
});