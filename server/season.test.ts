import { describe, expect, it } from "vitest";
import { formatSeasonLabel, getCurrentSeason } from "./season.js";

describe("getCurrentSeason", () => {
  it("maps October to the fall season", () => {
    expect(getCurrentSeason(new Date(2026, 9, 9))).toEqual({
      season: "FALL",
      year: 2026,
      label: "2026 秋季",
    });
  });

  it("maps season boundaries correctly", () => {
    expect(getCurrentSeason(new Date(2026, 2, 31)).season).toBe("WINTER");
    expect(getCurrentSeason(new Date(2026, 3, 1)).season).toBe("SPRING");
    expect(getCurrentSeason(new Date(2026, 5, 30)).season).toBe("SPRING");
    expect(getCurrentSeason(new Date(2026, 6, 1)).season).toBe("SUMMER");
    expect(getCurrentSeason(new Date(2026, 8, 30)).season).toBe("SUMMER");
    expect(getCurrentSeason(new Date(2026, 9, 1)).season).toBe("FALL");
  });

  it("formats Chinese labels", () => {
    expect(formatSeasonLabel("SPRING", 2027)).toBe("2027 春季");
  });
});