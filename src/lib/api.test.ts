import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnimeDetail } from "../../shared/contracts";

vi.mock("./anilist", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./anilist")>();
  return { ...actual, fetchAniListDetail: vi.fn() };
});

import { fetchAniListDetail } from "./anilist";
import { api } from "./api";

const mockedDirectDetail = vi.mocked(fetchAniListDetail);

const detail: AnimeDetail = {
  key: "anilist:10087",
  source: "anilist",
  title: { original: "Fate/Zero", romaji: "Fate/Zero" },
  cover: "https://example.com/fate.jpg",
  banner: "https://example.com/fate-banner.jpg",
  synopsis: "A battle for the Holy Grail.",
  genres: ["Action"],
  score: 85,
  episodes: 13,
  status: "已完结",
  airDay: "星期五",
  siteUrl: "https://anilist.co/anime/10087",
  studios: ["ufotable"],
  tags: ["Action"],
  externalLinks: [{ label: "Official Site", url: "https://example.com/official" }],
  trailerUrl: "https://www.youtube.com/watch?v=abc123",
  sourceUpdatedAt: "2026-10-10T00:00:00.000Z",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("api.anime", () => {
  it("uses browser AniList detail first and does not call the Worker", async () => {
    mockedDirectDetail.mockResolvedValue(detail);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.anime("anilist", "10087");
    expect(result).toEqual(detail);
    expect(mockedDirectDetail).toHaveBeenCalledWith(10087, undefined);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the Worker when browser AniList detail fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockedDirectDetail.mockRejectedValue(new Error("blocked"));
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(detail), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.anime("anilist", "10087");
    expect(result).toEqual(detail);
    expect(fetchMock).toHaveBeenCalledWith("/api/anime/anilist/10087", expect.objectContaining({ headers: { Accept: "application/json" } }));
  });

  it("keeps Bangumi details on the Worker", async () => {
    const bangumiDetail: AnimeDetail = { ...detail, key: "bangumi:123", source: "bangumi" };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(bangumiDetail), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.anime("bangumi", "123");
    expect(result).toEqual(bangumiDetail);
    expect(mockedDirectDetail).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/anime/bangumi/123", expect.objectContaining({ headers: { Accept: "application/json" } }));
  });
});