// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { AnimeSummary } from "../../shared/contracts";
import { pickRandomAnime, readRecentKeys, rememberRecentKey } from "./random";

const items: AnimeSummary[] = [
  { key: "bangumi:1", source: "bangumi", title: { original: "A" }, cover: "", genres: [], status: "连载中" },
  { key: "bangumi:2", source: "bangumi", title: { original: "B" }, cover: "", genres: [], status: "连载中" },
  { key: "bangumi:3", source: "bangumi", title: { original: "C" }, cover: "", genres: [], status: "连载中" },
];

beforeEach(() => {
  window.localStorage.clear();
});

describe("random draw helpers", () => {
  it("avoids recently drawn keys", () => {
    const picked = pickRandomAnime(items, () => 0, ["bangumi:1", "bangumi:2"]);
    expect(picked?.key).toBe("bangumi:3");
  });

  it("falls back to the full pool when every item was recent", () => {
    const picked = pickRandomAnime(items, () => 0.99, ["bangumi:1", "bangumi:2", "bangumi:3"]);
    expect(picked?.key).toBe("bangumi:3");
  });

  it("keeps at most five recent keys", () => {
    for (const item of ["1", "2", "3", "4", "5", "6"]) rememberRecentKey(`bangumi:${item}`);
    expect(readRecentKeys()).toEqual(["bangumi:6", "bangumi:5", "bangumi:4", "bangumi:3", "bangumi:2"]);
  });
});