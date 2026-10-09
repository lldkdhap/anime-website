import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "../../shared/contracts.js";
import { fetchText, parseDate, stableId, stripHtml, truncateText, uniqueBy } from "../utils.js";

type UnknownRecord = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  trimValues: true,
  parseTagValue: false,
});

const newsSources = [
  {
    name: "Anime News Network",
    url: "https://www.animenewsnetwork.com/all/rss.xml",
  },
  {
    name: "Anime Corner",
    url: "https://animecorner.me/feed/",
  },
] as const;

export interface NewsFetchResult {
  items: NewsItem[];
  sources: string[];
  degraded: boolean;
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asRecords(value: unknown): UnknownRecord[] {
  return asArray(value)
    .map((entry) => asRecord(entry))
    .filter((entry): entry is UnknownRecord => Boolean(entry));
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    for (const entry of value) {
      const text = textValue(entry);
      if (text) return text;
    }
    return "";
  }
  const record = asRecord(value);
  if (!record) return "";
  return textValue(record["#text"] ?? record["#cdata"] ?? record["@_href"] ?? "");
}

function attributeValue(value: unknown, attribute: string): string | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = attributeValue(entry, attribute);
      if (found) return found;
    }
    return undefined;
  }
  const record = asRecord(value);
  if (!record) return undefined;
  const found = textValue(record[attribute]);
  return found || undefined;
}

function extractItems(parsed: UnknownRecord): UnknownRecord[] {
  const rss = asRecord(parsed.rss);
  const channel = asRecord(rss?.channel);
  if (channel?.item) return asRecords(channel.item);

  const feed = asRecord(parsed.feed);
  if (feed?.entry) return asRecords(feed.entry);

  const rdf = asRecord(parsed["rdf:RDF"]);
  if (rdf?.item) return asRecords(rdf.item);

  return [];
}

function firstImage(item: UnknownRecord): string | undefined {
  const mediaUrl = attributeValue(item["media:content"], "@_url");
  if (mediaUrl) return mediaUrl;
  const thumbnailUrl = attributeValue(item["media:thumbnail"], "@_url");
  if (thumbnailUrl) return thumbnailUrl;
  const enclosureUrl = attributeValue(item.enclosure, "@_url");
  if (enclosureUrl) return enclosureUrl;
  const html = textValue(item["content:encoded"]) || textValue(item.content) || textValue(item.description);
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

function normalizeItem(item: UnknownRecord, source: string): NewsItem | undefined {
  const title = stripHtml(textValue(item.title));
  const url =
    textValue(item.link) ||
    attributeValue(item.link, "@_href") ||
    textValue(item.guid) ||
    attributeValue(item.guid, "@_isPermaLink");
  if (!title || !url || !/^https?:\/\//.test(url)) return undefined;

  const rawExcerpt =
    textValue(item.contentSnippet) ||
    textValue(item.summary) ||
    textValue(item["content:encoded"]) ||
    textValue(item.description) ||
    textValue(item.content);
  const excerpt = truncateText(stripHtml(rawExcerpt), 220);
  const publishedAt =
    parseDate(
      textValue(item.isoDate) ||
        textValue(item["dc:date"]) ||
        textValue(item.pubDate) ||
        textValue(item.updated) ||
        textValue(item.published),
    ) ?? new Date(0).toISOString();
  const tags = asArray(item.category)
    .map((entry) => stripHtml(textValue(entry)))
    .filter(Boolean)
    .slice(0, 3);

  return {
    id: stableId(url),
    source,
    title,
    excerpt,
    url,
    image: firstImage(item),
    publishedAt,
    tags: tags.length > 0 ? tags : [source],
  };
}

export async function fetchNews(limit: number): Promise<NewsFetchResult> {
  const settled = await Promise.allSettled(
    newsSources.map(async (source) => {
      const xml = await fetchText(source.url);
      const parsed = asRecord(parser.parse(xml));
      if (!parsed) throw new Error(`${source.name} 返回了无法解析的 XML`);
      return extractItems(parsed)
        .map((item) => normalizeItem(item, source.name))
        .filter((item): item is NewsItem => Boolean(item));
    }),
  );

  const items = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const fulfilledSources = newsSources
    .filter((_, index) => settled[index]?.status === "fulfilled")
    .map((source) => source.name);
  const deduped = uniqueBy(items, (item) => item.url.replace(/[?#].*$/, "") || item.title.toLowerCase());
  deduped.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  return {
    items: deduped.slice(0, limit),
    sources: fulfilledSources,
    degraded: fulfilledSources.length < newsSources.length,
  };
}