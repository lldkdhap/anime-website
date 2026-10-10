// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AniListSearchItem } from "../lib/anilist";
import { searchAniList } from "../lib/anilist";
import { SearchBar } from "./SearchBar";

vi.mock("../lib/anilist", () => ({
  searchAniList: vi.fn(),
}));

const mockedSearch = vi.mocked(searchAniList);

const sample: AniListSearchItem = {
  id: 10087,
  title: { romaji: "Fate/Zero", english: "Fate/Zero", native: "フェイト/ゼロ" },
  coverImage: { large: "https://example.com/fate.jpg" },
  averageScore: 85,
  genres: ["Action", "Fantasy"],
  status: "FINISHED",
  episodes: 13,
};

function renderSearchBar() {
  return render(
    <MemoryRouter>
      <SearchBar />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  mockedSearch.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("SearchBar", () => {
  it("debounces input and requests once after 500ms", async () => {
    mockedSearch.mockResolvedValue([]);
    renderSearchBar();
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "Fate" } });
    expect(mockedSearch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });
    expect(mockedSearch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mockedSearch).toHaveBeenCalledTimes(1);
    expect(mockedSearch).toHaveBeenCalledWith("Fate", expect.any(AbortSignal));
  });

  it("renders results as links to the AniList detail route", async () => {
    mockedSearch.mockResolvedValue([sample]);
    renderSearchBar();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Fate" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    const link = screen.getByRole("option", { name: /Fate\/Zero/ });
    expect(link).toHaveAttribute("href", "/anime/anilist/10087");
    expect(screen.getByText("找到 1 条结果")).toBeInTheDocument();
  });

  it("shows loading and empty states", async () => {
    mockedSearch.mockImplementation(() => new Promise(() => {}));
    renderSearchBar();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Fate" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText("正在搜索…")).toBeInTheDocument();

    mockedSearch.mockResolvedValue([]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Nothing" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText("没有找到相关番剧，换个关键词试试？")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    mockedSearch.mockRejectedValue(new Error("boom"));
    renderSearchBar();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Fate" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText("搜索失败，请稍后重试。")).toBeInTheDocument();
  });

  it("aborts the previous request when the query changes", async () => {
    const signals: AbortSignal[] = [];
    mockedSearch.mockImplementation((_query, signal) => {
      if (signal) signals.push(signal);
      return new Promise(() => {});
    });
    renderSearchBar();
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "Fate" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(signals).toHaveLength(1);

    fireEvent.change(input, { target: { value: "Fate Zero" } });
    await act(async () => {});
    expect(signals[0]?.aborted).toBe(true);
  });

  it("closes on escape and outside pointer interaction", async () => {
    mockedSearch.mockResolvedValue([sample]);
    renderSearchBar();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Fate" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveAttribute("aria-expanded", "false");

    fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(document.body);
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
});