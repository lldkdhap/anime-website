import type { SeasonName } from "../shared/contracts.js";

export interface SeasonInfo {
  season: SeasonName;
  year: number;
  label: string;
}

const seasonZh: Record<SeasonName, string> = {
  WINTER: "冬季",
  SPRING: "春季",
  SUMMER: "夏季",
  FALL: "秋季",
};

export function getCurrentSeason(date = new Date()): SeasonInfo {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const season: SeasonName = month <= 3 ? "WINTER" : month <= 6 ? "SPRING" : month <= 9 ? "SUMMER" : "FALL";
  return { season, year, label: `${year} ${seasonZh[season]}` };
}

export function formatSeasonLabel(season: SeasonName, year: number): string {
  return `${year} ${seasonZh[season]}`;
}