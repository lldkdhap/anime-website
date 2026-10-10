// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnimeSummary, NewsResponse, SeasonResponse } from "../../shared/contracts";
import { api } from "../lib/api";
import NewsPage from "./NewsPage";

vi.mock("../lib/api", () => ({
  api: { season: vi.fn(), news: vi.fn() },
}));

vi.mock("../lib/gsap", () => ({
  gsap: { to: vi.fn() },
  useGSAP: vi.fn(),
}));

vi.mock("../components/AnimeCard", () => ({
  AnimeCard: ({ anime }: { anime: AnimeSummary }) => (
    <div data-testid="anime-card">{`${anime.title.original}:${anime.score ?? 0}`}</div>
  ),
}));

vi.mock("../components/NewsCard", () => ({
  NewsCard: () => null,
}));

const scrollIntoView = vi.fn();

const mockedSeason = vi.mocked(api.season);
const mockedNews = vi.mocked(api.news);

const seasonResponse: SeasonResponse = {
  season: "FALL",
  year: 2026,
  label: "2026 秋季",
  updatedAt: "2026-10-10T00:00:00.000Z",
  source: "anilist",
  items: [
    { key: "anilist:1", source: "anilist", title: { original: "Medium" }, cover: "", genres: [], status: "连载中", score: 70 },
    { key: "anilist:2", source: "anilist", title: { original: "High" }, cover: "", genres: [], status: "连载中", score: 85 },
    { key: "anilist:3", source: "anilist", title: { original: "Unknown" }, cover: "", genres: [], status: "连载中" },
  ],
};

const newsResponse: NewsResponse = {
  updatedAt: "2026-10-10T00:00:00.000Z",
  sources: [],
  items: [],
};

function renderPage(initialEntries: string[] = ["/"]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <NewsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockedSeason.mockReset();
  mockedNews.mockReset();
  scrollIntoView.mockReset();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("NewsPage season ordering", () => {
  it("renders the seasonal cards from highest score to lowest", async () => {
    mockedSeason.mockResolvedValue(seasonResponse);
    mockedNews.mockResolvedValue(newsResponse);
    renderPage();

    expect(document.getElementById("global-news")).toBeInTheDocument();

    const cards = await screen.findAllByTestId("anime-card");
    expect(cards.map((card) => card.textContent)).toEqual(["High:85", "Medium:70", "Unknown:0"]);
  });
});
describe("NewsPage hash scrolling", () => {
  it("scrolls to the global news section on first mount", async () => {
    mockedSeason.mockResolvedValue(seasonResponse);
    mockedNews.mockResolvedValue(newsResponse);
    renderPage(["/news#global-news"]);

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" }));
  });
});