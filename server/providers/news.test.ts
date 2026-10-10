import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchNews } from "./news.js";

const feed = (title: string, link: string, date: string) => `<?xml version="1.0"?>
<rss version="2.0"><channel><item>
<title>${title}</title><link>${link}</link><pubDate>${date}</pubDate>
<description>Short summary for ${title}</description>
</item></channel></rss>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchNews", () => {
  it("merges sources, deduplicates and sorts newest first", async () => {
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("animenewsnetwork")) {
        return new Response(feed("Older story", "https://example.com/older", "Wed, 01 Oct 2026 00:00:00 GMT"), { status: 200 });
      }
      return new Response(feed("Newer story", "https://example.com/newer", "Fri, 09 Oct 2026 00:00:00 GMT"), { status: 200 });
    });

    const result = await fetchNews(10);
    expect(result.degraded).toBe(false);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.title).toBe("Newer story");
  });

  it("marks the result degraded when one source fails", async () => {
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("animenewsnetwork")) {
        return new Response("boom", { status: 500 });
      }
      return new Response(feed("Only story", "https://example.com/only", "Fri, 09 Oct 2026 00:00:00 GMT"), { status: 200 });
    });

    const result = await fetchNews(10);
    expect(result.degraded).toBe(true);
    expect(result.items).toHaveLength(1);
  });
});