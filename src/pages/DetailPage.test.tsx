// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnimeDetail } from "../../shared/contracts";
import { api } from "../lib/api";
import DetailPage from "./DetailPage";

vi.mock("../lib/api", () => ({
  api: { anime: vi.fn() },
}));

const mockedAnime = vi.mocked(api.anime);

const detail: AnimeDetail = {
  key: "anilist:10087",
  source: "anilist",
  title: { original: "Fate/Zero", romaji: "Fate/Zero" },
  cover: "https://example.com/fate.jpg",
  banner: "https://example.com/fate-banner.jpg",
  synopsis: "A battle for the Holy Grail.",
  genres: ["Action", "Fantasy"],
  score: 85,
  episodes: 13,
  status: "已完结",
  airDay: "星期五",
  siteUrl: "https://anilist.co/anime/10087",
  studios: ["ufotable"],
  tags: ["Action", "Fantasy"],
  externalLinks: [{ label: "Official Site", url: "https://example.com/official" }],
  trailerUrl: "https://www.youtube.com/watch?v=abc123",
  sourceUpdatedAt: "2026-10-10T00:00:00.000Z",
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/anime/anilist/10087"]}>
        <Routes>
          <Route path="/anime/:source/:id" element={<DetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockedAnime.mockReset();
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

describe("DetailPage", () => {
  it("renders detail data from the direct AniList path", async () => {
    mockedAnime.mockResolvedValue(detail);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Fate/Zero" })).toBeInTheDocument();
    expect(screen.getByText("ufotable")).toBeInTheDocument();
    expect(screen.getByText("A battle for the Holy Grail.")).toBeInTheDocument();
  });

  it("renders the error state when both detail sources fail", async () => {
    mockedAnime.mockRejectedValue(new Error("详情接口失败"));
    renderPage();

    expect(await screen.findByText("详情接口失败")).toBeInTheDocument();
  });
});