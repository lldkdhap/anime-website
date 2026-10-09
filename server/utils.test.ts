import { describe, expect, it } from "vitest";
import { parseDate, stableId, stripHtml, truncateText, uniqueBy } from "./utils.js";

describe("server utils", () => {
  it("strips tags and decodes entities", () => {
    expect(stripHtml("<p>Hello &amp; <strong>world</strong></p>")).toBe("Hello & world");
  });

  it("truncates long text with an ellipsis", () => {
    expect(truncateText("一二三四五六", 4)).toBe("一二三…");
  });

  it("creates stable short ids", () => {
    expect(stableId("https://example.com/a")).toBe(stableId("https://example.com/a"));
    expect(stableId("https://example.com/a")).not.toBe(stableId("https://example.com/b"));
  });

  it("deduplicates by key while preserving order", () => {
    expect(uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], (item) => String(item.id))).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("rejects invalid dates", () => {
    expect(parseDate("not-a-date")).toBeUndefined();
    expect(parseDate("2026-10-09T00:00:00.000Z")).toBe("2026-10-09T00:00:00.000Z");
  });
});