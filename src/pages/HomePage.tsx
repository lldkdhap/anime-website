import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Radio, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { Link } from "react-router";
import { AnimeCard } from "../components/AnimeCard";
import { ErrorState, LoadingGrid } from "../components/AsyncState";
import { NewsCard } from "../components/NewsCard";
import { PageTransition } from "../components/PageTransition";
import { api } from "../lib/api";
import { gsap, useGSAP } from "../lib/gsap";

export default function HomePage() {
  const season = useQuery({ queryKey: ["season"], queryFn: () => api.season() });
  const news = useQuery({ queryKey: ["news", 4], queryFn: () => api.news(4) });
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .from(".hero-eyebrow", { y: 18, opacity: 0, duration: 0.6 })
        .from(".hero-title span", { y: 42, opacity: 0, stagger: 0.07, duration: 0.72 }, "-=0.25")
        .from(".hero-copy", { y: 20, opacity: 0, duration: 0.6 }, "-=0.35")
        .from(".hero-actions > *", { y: 16, opacity: 0, stagger: 0.08, duration: 0.5 }, "-=0.3");
    },
    { scope: heroRef },
  );

  return (
    <PageTransition className="flex flex-1 flex-col">
      <section ref={heroRef} className="relative px-4 pb-16 pt-16 sm:pt-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <span className="hero-eyebrow inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2 text-xs tracking-[0.28em] text-neon-cyan uppercase">
              <Radio className="size-4" />
              {season.data?.label ?? "正在校准季节雷达"}
            </span>
            <h1 className="hero-title text-5xl font-black leading-[1.04] tracking-[-0.04em] sm:text-6xl xl:text-7xl">
              <span className="block">把下一部</span>
              <span className="block">想看的番</span>
              <span className="gradient-text block">交给运气。</span>
            </h1>
            <p className="hero-copy max-w-2xl text-base leading-8 text-[var(--text-soft)] sm:text-lg">
              聚合当季新番与全球动漫资讯，再用一张会翻转的卡牌随机揭晓下一部作品。中文标题优先，来源透明，动效拉满。
            </p>
            <div className="hero-actions flex flex-wrap gap-4">
              <Link to="/random" className="neon-button px-6 py-3.5 text-sm font-bold">
                <Sparkles className="size-4" />
                随机抽一张
              </Link>
              <Link
                to="/news"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/8"
              >
                查看新番资讯
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel-strong relative overflow-hidden rounded-[2.5rem] p-6"
          >
            <div className="absolute -right-16 -top-16 size-56 rounded-full bg-neon-pink/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-neon-cyan/20 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              {(season.data?.items ?? []).slice(0, 4).map((anime) => (
                <AnimeCard key={anime.key} anime={anime} compact layoutIdPrefix="home-poster" />
              ))}
              {season.isLoading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton aspect-[3/4] rounded-3xl" />) : null}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.3em] text-neon-cyan uppercase">Season Radar</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">本季值得盯住的番</h2>
            </div>
            <Link to="/news" className="inline-flex items-center gap-2 text-sm text-[var(--text-soft)] transition hover:text-white">
              查看完整列表 <ArrowRight className="size-4" />
            </Link>
          </div>
          {season.isError ? (
            <ErrorState message={season.error instanceof Error ? season.error.message : "当季数据加载失败。"} onRetry={() => void season.refetch()} />
          ) : null}
          {season.isLoading ? <LoadingGrid count={6} /> : null}
          {season.data ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {season.data.items.slice(0, 6).map((anime) => (
                <AnimeCard key={anime.key} anime={anime} layoutIdPrefix="shared" />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <p className="text-xs tracking-[0.3em] text-neon-pink uppercase">News Flash</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">最新动漫情报</h2>
          </div>
          {news.isError ? (
            <ErrorState message={news.error instanceof Error ? news.error.message : "资讯加载失败。"} onRetry={() => void news.refetch()} />
          ) : null}
          {news.isLoading ? <LoadingGrid count={3} /> : null}
          {news.data ? (
            <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
              {news.data.items.map((item, index) => (
                <NewsCard key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}