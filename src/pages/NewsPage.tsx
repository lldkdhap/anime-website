import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { motion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { AnimeCard } from "../components/AnimeCard";
import { EmptyState, ErrorState, LoadingGrid } from "../components/AsyncState";
import { NewsCard } from "../components/NewsCard";
import { PageTransition } from "../components/PageTransition";
import { api } from "../lib/api";
import { sortAnimeByScoreDesc } from "../lib/format";
import { gsap, useGSAP } from "../lib/gsap";

const ALL_SOURCES = "全部来源";

export default function NewsPage() {
  const season = useQuery({ queryKey: ["season"], queryFn: () => api.season() });
  const news = useQuery({ queryKey: ["news", 24], queryFn: () => api.news(24) });
  const [source, setSource] = useState(ALL_SOURCES);
  const location = useLocation();
  const heroRef = useRef<HTMLElement>(null);

  const sources = useMemo(() => [ALL_SOURCES, ...(news.data?.sources ?? [])], [news.data?.sources]);
  useLayoutEffect(() => {
    if (location.hash !== "#global-news") return;
    document.getElementById("global-news")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  const filtered = useMemo(
    () => (news.data?.items ?? []).filter((item) => source === ALL_SOURCES || item.source === source),
    [news.data?.items, source],
  );
  const sortedSeasonItems = useMemo(
    () => sortAnimeByScoreDesc(season.data?.items ?? []),
    [season.data?.items],
  );

  useGSAP(
    () => {
      if (!heroRef.current) return;
      gsap.to(".news-hero-bg", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: heroRef },
  );

  return (
    <PageTransition className="flex flex-1 flex-col">
      <section ref={heroRef} className="relative overflow-hidden px-4 pb-14 pt-14 sm:pt-20">
        <div className="news-hero-bg absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(94,231,255,0.18),transparent_34rem),radial-gradient(circle_at_82%_12%,rgba(255,79,216,0.16),transparent_32rem)]" />
        <div className="mx-auto max-w-7xl space-y-6">
          <p className="text-xs tracking-[0.32em] text-neon-cyan uppercase">Season Timeline</p>
          <h1 className="text-4xl font-black tracking-[-0.03em] sm:text-6xl">新番资讯与当季时间轴</h1>
          <p className="max-w-3xl text-base leading-8 text-[var(--text-soft)]">
            先看本季作品，再读全球动漫媒体的最新报道。新闻按发布时间倒序去重，保留来源与原文链接。
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--text-soft)]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <CalendarDays className="size-4 text-neon-cyan" />
              {season.data?.label ?? "正在读取季度"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              数据源：{season.data?.source === "anilist" ? "AniList 回退" : "Bangumi 优先"}
            </span>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {season.isError ? (
            <ErrorState message={season.error instanceof Error ? season.error.message : "当季数据加载失败。"} onRetry={() => void season.refetch()} />
          ) : null}
          {season.isLoading ? <LoadingGrid count={6} /> : null}
          {season.data ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {sortedSeasonItems.map((anime) => (
                <AnimeCard key={anime.key} anime={anime} layoutIdPrefix="news-season" />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section id="global-news" className="scroll-mt-28 px-4 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.3em] text-neon-pink uppercase">News Feed</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">全球动漫资讯</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSource(item)}
                  className="relative rounded-full border border-white/10 px-4 py-2 text-xs text-[var(--text-soft)] transition hover:text-white"
                >
                  {source === item ? (
                    <motion.span
                      layoutId="source-pill"
                      className="absolute inset-0 rounded-full border border-neon-pink/40 bg-neon-pink/12"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative z-10">{item}</span>
                </button>
              ))}
            </div>
          </div>
          {news.data?.degraded ? (
            <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-[var(--text-soft)]">
              部分新闻源暂时不可用，当前展示已成功获取的内容。
            </div>
          ) : null}
          {news.isError ? (
            <ErrorState message={news.error instanceof Error ? news.error.message : "资讯加载失败。"} onRetry={() => void news.refetch()} />
          ) : null}
          {news.isLoading ? <LoadingGrid count={6} /> : null}
          {!news.isLoading && !news.isError && filtered.length === 0 ? <EmptyState message="当前筛选条件下没有资讯。" /> : null}
          {filtered.length > 0 ? (
            <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
              {filtered.map((item, index) => (
                <NewsCard key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}