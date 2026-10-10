import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAniListDetail, searchAniList } from "./anilist";

const item = {
  id: 10087,
  title: { romaji: "Fate/Zero", english: "Fate/Zero", native: "フェイト/ゼロ" },
  coverImage: { large: "https://example.com/fate.jpg" },
  averageScore: 85,
  genres: ["Action", "Fantasy"],
  status: "FINISHED",
  episodes: 13,
};

const detail = {
  id: 10087,
  title: { romaji: "Fate/Zero", english: "Fate/Zero", native: "フェイト/ゼロ" },
  coverImage: { extraLarge: "https://example.com/fate-large.jpg" },
  bannerImage: "https://example.com/fate-banner.jpg",
  description: "<p>A battle for the Holy Grail.</p>",
  genres: ["Action", "Fantasy"],
  averageScore: 85,
  episodes: 13,
  status: "FINISHED",
  siteUrl: "https://anilist.co/anime/10087",
  nextAiringEpisode: { episode: 2, airingAt: 1_700_000_000 },
  trailer: { id: "abc123", site: "youtube" },
  externalLinks: [{ site: "Official Site", url: "https://example.com/official" }],
  studios: { nodes: [{ name: "ufotable" }] },
  tags: [{ name: "Action" }, { name: "Fantasy" }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchAniList", () => {
  it("parses successful AniList results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: { Page: { media: [item] } } }), { status: 200 })),
    );
    const results = await searchAniList("Fate");
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe(10087);
    expect(results[0]?.title?.romaji).toBe("Fate/Zero");
  });

  it("returns an empty list for an empty query without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchAniList("   ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on GraphQL errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ errors: [{ message: "Rate limited" }] }), { status: 200 })),
    );
    await expect(searchAniList("Fate")).rejects.toThrow("Rate limited");
  });

  it("throws on non-200 responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("failed", { status: 429 })));
    await expect(searchAniList("Fate")).rejects.toThrow("AniList 请求失败: 429");
  });
});

describe("fetchAniListDetail", () => {
  it("maps AniList detail data to AnimeDetail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: { Media: detail } }), { status: 200 })),
    );
    const result = await fetchAniListDetail(10087);
    expect(result.key).toBe("anilist:10087");
    expect(result.title.original).toBe("Fate/Zero");
    expect(result.synopsis).toBe("A battle for the Holy Grail.");
    expect(result.status).toBe("已完结");
    expect(result.studios).toEqual(["ufotable"]);
    expect(result.externalLinks).toEqual([{ label: "Official Site", url: "https://example.com/official" }]);
    expect(result.trailerUrl).toBe("https://www.youtube.com/watch?v=abc123");
    expect(result.airDay).toBeDefined();
  });

  it("throws on GraphQL errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ errors: [{ message: "Not found" }] }), { status: 200 })),
    );
    await expect(fetchAniListDetail(999)).rejects.toThrow("Not found");
  });

  it("throws on non-200 responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("failed", { status: 502 })));
    await expect(fetchAniListDetail(10087)).rejects.toThrow("AniList 请求失败: 502");
  });
});