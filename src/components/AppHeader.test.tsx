// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

vi.mock("./SearchBar", () => ({
  SearchBar: () => <div data-testid="search-bar" />,
}));

const scrollIntoView = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
});

afterEach(() => {
  cleanup();
});

describe("AppHeader news link", () => {
  it("links to the global news anchor and scrolls when already on /news", () => {
    render(
      <MemoryRouter initialEntries={["/news"]}>
        <div id="global-news" />
        <AppHeader />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /新番资讯/ });
    expect(link).toHaveAttribute("href", "/news#global-news");

    fireEvent.click(link);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });
});