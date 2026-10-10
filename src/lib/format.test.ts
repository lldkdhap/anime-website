import { describe, expect, it } from "vitest";
import type { AnimeSummary } from "../../shared/contracts";
import { formatTodayShanghai, sortAnimeByScoreDesc } from "./format";

function anime(key: string, score: number | undefined, title: string): AnimeSummary {
  return {
    key,
    source: "anilist",
    title: { original: title },
    cover: "",
    genres: [],
    status: "连载中",
    score,
  };
}

describe("sortAnimeByScoreDesc", () => {
  it("sorts AniList 0-100 scores from high to low and puts unscored items last", () => {
    const result = sortAnimeByScoreDesc([
      anime("anilist:1", 70, "Medium"),
      anime("anilist:2", undefined, "Unknown"),
      anime("anilist:3", 85, "High"),
    ]);
    expect(result.map((item) => item.key)).toEqual(["anilist:3", "anilist:1", "anilist:2"]);
  });

  it("sorts Bangumi 0-10 scores from high to low", () => {
    const result = sortAnimeByScoreDesc([
      anime("bangumi:1", 7.2, "Seven"),
      anime("bangumi:2", 8.5, "Eight"),
    ]);
    expect(result.map((item) => item.key)).toEqual(["bangumi:2", "bangumi:1"]);
  });

  it("uses a deterministic title and key tie-breaker for equal scores", () => {
    const result = sortAnimeByScoreDesc([
      anime("anilist:2", 8, "Beta"),
      anime("anilist:1", 8, "Alpha"),
    ]);
    expect(result.map((item) => item.key)).toEqual(["anilist:1", "anilist:2"]);
  });

  it("does not mutate the input array", () => {
    const input = [anime("anilist:1", 70, "Low"), anime("anilist:2", 90, "High")];
    sortAnimeByScoreDesc(input);
    expect(input.map((item) => item.key)).toEqual(["anilist:1", "anilist:2"]);
  });
});
describe("formatTodayShanghai", () => {
  it("formats a fixed Shanghai date with the weekday", () => {
    expect(formatTodayShanghai(new Date("2026-10-10T04:00:00Z"))).toBe("2026年10月10日 星期六");
  });

  it("uses Asia/Shanghai timezone across UTC date boundaries", () => {
    expect(formatTodayShanghai(new Date("2026-10-09T16:30:00Z"))).toBe("2026年10月10日 星期六");
  });
});