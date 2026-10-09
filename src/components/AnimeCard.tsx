import { CalendarDays, Star } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import type { AnimeSummary } from "../../shared/contracts";
import { displayTitle, formatScore, secondaryTitle } from "../lib/format";
import { TiltCard } from "./TiltCard";

interface AnimeCardProps {
  anime: AnimeSummary;
  layoutIdPrefix?: string;
  compact?: boolean;
}

export function AnimeCard({ anime, layoutIdPrefix = "poster", compact = false }: AnimeCardProps) {
  const externalId = anime.key.split(":")[1] ?? "";
  const cover = anime.cover;

  return (
    <TiltCard className="group h-full">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        className="glass-panel flex h-full flex-col overflow-hidden rounded-[1.75rem]"
      >
        <Link to={`/anime/${anime.source}/${externalId}`} className="flex h-full flex-col">
          <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-neon-violet/30 via-black/40 to-neon-cyan/20">
            {cover ? (
              <motion.img
                layoutId={layoutIdPrefix === "shared" ? `poster-${anime.key}` : undefined}
                src={cover}
                alt={displayTitle(anime.title)}
                loading="lazy"
                className="size-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-white/60">暂无封面</div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur">
                {anime.source === "bangumi" ? "Bangumi" : "AniList"}
              </span>
              {anime.airDay ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-[11px] text-neon-cyan">
                  <CalendarDays className="size-3" />
                  {anime.airDay}
                </span>
              ) : null}
            </div>
          </div>
          <div className={`flex flex-1 flex-col gap-2 ${compact ? "p-4" : "p-5"}`}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-lg font-bold leading-snug">{displayTitle(anime.title)}</h3>
              {anime.score ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs text-neon-pink">
                  <Star className="size-3" />
                  {formatScore(anime.score)}
                </span>
              ) : null}
            </div>
            {secondaryTitle(anime.title) ? (
              <p className="line-clamp-1 text-xs text-[var(--text-soft)]">{secondaryTitle(anime.title)}</p>
            ) : null}
            {anime.genres.length > 0 ? (
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {anime.genres.slice(0, 3).map((genre) => (
                  <span key={genre} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[var(--text-soft)]">
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Link>
      </motion.div>
    </TiltCard>
  );
}