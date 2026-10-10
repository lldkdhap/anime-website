// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeveloperCard } from "./DeveloperCard";

describe("DeveloperCard", () => {
  it("renders developer information and accessible outbound links", () => {
    render(<DeveloperCard />);

    expect(screen.getByText(/某北信科的路人甲/)).toBeInTheDocument();
    expect(screen.getByText(/本动漫雷达网站由个人独立构思/)).toBeInTheDocument();
    expect(screen.getByText("© 2026 动漫雷达 ｜ 使用 Vibe Coding 创作")).toBeInTheDocument();

    const github = screen.getByRole("link", { name: /Github个人主页/ });
    expect(github).toHaveAttribute("href", "https://github.com/lldkdhap");
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noreferrer");

    const blog = screen.getByRole("link", { name: /个人博客/ });
    expect(blog).toHaveAttribute("href", "https://lldkdhap.github.io/");
    expect(blog).toHaveAttribute("target", "_blank");
    expect(blog).toHaveAttribute("rel", "noreferrer");
  });
});