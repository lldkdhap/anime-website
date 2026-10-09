import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clapperboard, ExternalLink, Star } from "lucide-react";
import { motion } from "motion/react";
import { Link, useNavigate, useParams } from "react-router";
import { ErrorState, LoadingScreen } from "../components/AsyncState";
import { PageTransition } from "../components/PageTransition";
import { api } from "../lib/api";
import { displayTitle, formatEpisodes, formatScore, secondaryTitle } from "../lib/format";

export default function DetailPage() {
  const params = useParams<{ source: string; id: string }>();
  const navigate = useNavigate();
  const source = params.source === "bangumi" || params.source === "anilist" ? params.source : undefined;
  const detail = useQuery({
    queryKey: ["anime", source, params.id],
    queryFn: () => api.anime(source!, params.id!),
    enabled: Boolean(source && params.id),
  });

  if (!source || !params.id) {
    return (
      <PageTransition className="flex flex-1 flex-col px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <ErrorState message="番剧来源或编号无效。" />
        </div>
      </PageTransition>
    );
  }

  if (detail.isLoading) {
    return (
      <PageTransition className="flex flex-1 flex-col px-4 py-16">
        <div className="mx-auto w-full max-w-5xl">
          <LoadingScreen />
        </div>
      </PageTransition>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <PageTransition className="flex flex-1 flex-col px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <ErrorState message={detail.error instanceof Error ? detail.error.message : "番剧详情加载失败。"} onRetry={() => void detail.refetch()} />
        </div>
      </PageTransition>
    );
  }

  const anime = detail.data;

  return (
    <PageTransition className="flex flex-1 flex-col">
      <section className="relative px-4 pb-16 pt-10">
        <div className="absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
          {anime.banner || anime.cover ? (
            <img src={anime.banner ?? anime.cover} alt="" className="size-full object-cover opacity-35 blur-sm" />
          ) : (
            <div className="size-full bg-gradient-to-br from-neon-violet/25 to-neon-cyan/15" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#05050a]/70 to-[#05050a]" />
        </div>

        <div className="mx-auto max-w-7xl">
          <button type="button" onClick={() => navigate(-1)} className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--text-soft)] transition hover:text-white">
            <ArrowLeft className="size-4" />
            返回
          </button>
          <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:items-start">
            <motion.div
              layoutId={`poster-${anime.key}`}
              className="glass-panel-strong overflow-hidden rounded-[2rem]"
            >
              {anime.cover ? (
                <img src={anime.cover} alt={displayTitle(anime.title)} className="aspect-[3/4] size-full object-cover" />
              ) : (
                <div className="aspect-[3/4] bg-gradient-to-br from-neon-violet/30 to-neon-cyan/20" />
              )}
            </motion.div>
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="inline-flex rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs text-neon-cyan">
                  {anime.source === "bangumi" ? "Bangumi" : "AniList"}
                </span>
                <h1 className="text-4xl font-black tracking-[-0.03em] sm:text-5xl">{displayTitle(anime.title)}</h1>
                {secondaryTitle(anime.title) ? <p className="text-[var(--text-soft)]">{secondaryTitle(anime.title)}</p> : null}
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{anime.status}</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Star className="size-4 text-neon-pink" />
                  {formatScore(anime.score)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Clapperboard className="size-4" />
                  {formatEpisodes(anime.episodes)}
                </span>
                {anime.airDay ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/25 bg-neon-cyan/10 px-4 py-2 text-neon-cyan">
                    <CalendarDays className="size-4" />
                    {anime.airDay}
                  </span>
                ) : null}
              </div>
              <p className="max-w-3xl text-base leading-8 text-[var(--text-soft)]">{anime.synopsis ?? "暂无简介。"}</p>
              <div className="flex flex-wrap gap-3">
                {anime.siteUrl ? (
                  <a href={anime.siteUrl} target="_blank" rel="noreferrer" className="neon-button px-5 py-3 text-sm font-semibold">
                    原始条目 <ExternalLink className="size-4" />
                  </a>
                ) : null}
                {anime.trailerUrl ? (
                  <a href={anime.trailerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm transition hover:border-white/25">
                    预告片 <ExternalLink className="size-4" />
                  </a>
                ) : null}
                <Link to="/random" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm transition hover:border-white/25">
                  再抽一部
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <div className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="mb-4 text-lg font-bold">标签</h2>
            <div className="flex flex-wrap gap-2">
              {(anime.tags.length > 0 ? anime.tags : anime.genres).map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--text-soft)]">{tag}</span>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="mb-4 text-lg font-bold">制作</h2>
            <p className="text-sm leading-7 text-[var(--text-soft)]">{anime.studios.length > 0 ? anime.studios.join("、") : "暂无制作信息。"}</p>
          </div>
          <div className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="mb-4 text-lg font-bold">外部链接</h2>
            <div className="space-y-3 text-sm">
              {anime.externalLinks.length > 0 ? anime.externalLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-[var(--text-soft)] transition hover:text-neon-cyan">
                  <span className="truncate">{link.label}</span>
                  <ExternalLink className="size-4 shrink-0" />
                </a>
              )) : <p className="text-[var(--text-soft)]">暂无外部链接。</p>}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}