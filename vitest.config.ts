import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.{ts,tsx}", "shared/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}", "worker/**/*.test.{ts,tsx}"],
    passWithNoTests: false,
  },
});