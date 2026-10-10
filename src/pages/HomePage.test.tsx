// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnimeSummary, NewsResponse, SeasonResponse } from "../../shared/contracts";
import { api } from "../lib/api";
import HomePage from "./HomePage";

vi.mock("../lib/api", () => ({
  api: { season: vi.fn(), news: vi.fn() },
}));

vi.mock("../lib/gsap", () => ({
  gsap: { timeline: vi.fn() },
  useGSAP: vi.fn(),
}));

vi.mock("../components/AnimeCard", () => ({
  AnimeCard: ({ anime, layoutIdPrefix }: { anime: AnimeSummary; layoutIdPrefix?: string }) => (
    <div data-testid={layoutIdPrefix === "home-poster" ? "hero-anime" : "season-anime"}>
      {`${anime.title.original}:${anime.score ?? 0}`}
    </div>
  ),
}));

vi.mock("../components/NewsCard", () => ({
  NewsCard: () => null,
}));

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

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockedSeason.mockReset();
  mockedNews.mockReset();
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

describe("HomePage seasonal ordering", () => {
  it("sorts both the hero showcase and the season grid by score", async () => {
    mockedSeason.mockResolvedValue(seasonResponse);
    mockedNews.mockResolvedValue(newsResponse);
    renderPage();

    expect(screen.getByText(/本站Anime Radar 是一个为追番而生的轻量入口/)).toBeInTheDocument();
    expect(screen.getByText("每日同步")).toBeInTheDocument();
    expect(screen.getByText(/\d{4}年\d+月\d+日 星期[一二三四五六日]/)).toBeInTheDocument();
    expect(screen.getByText("中文优先")).toBeInTheDocument();
    expect(screen.getByText("来源透明")).toBeInTheDocument();
    expect(screen.getByText("动效拉满")).toBeInTheDocument();

    const actions = screen.getByRole("link", { name: /随机抽一张/ });
    const devCard = screen.getByText("◇ Dev Profile ◇");
    expect(actions.compareDocumentPosition(devCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const heroCards = await screen.findAllByTestId("hero-anime");
    expect(heroCards.map((card) => card.textContent)).toEqual(["High:85", "Medium:70", "Unknown:0"]);

    const seasonCards = await screen.findAllByTestId("season-anime");
    expect(seasonCards.map((card) => card.textContent)).toEqual(["High:85", "Medium:70", "Unknown:0"]);
  });
});