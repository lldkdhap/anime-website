// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollToTop } from "./ScrollToTop";

const scrollIntoView = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  if (!window.requestAnimationFrame) {
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0),
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: (id: number) => window.clearTimeout(id),
    });
  }
});

afterEach(() => {
  cleanup();
});

describe("ScrollToTop", () => {
  it("scrolls to the top when there is no hash", () => {
    render(
      <MemoryRouter initialEntries={["/news"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("does not handle hash scrolling itself", () => {
    render(
      <MemoryRouter initialEntries={["/news#global-news"]}>
        <ScrollToTop />
        <div id="global-news" />
      </MemoryRouter>,
    );

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});