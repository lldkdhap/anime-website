import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clapperboard, ExternalLink, RotateCcw, Sparkles, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import type { AnimeSummary } from "../../shared/contracts";
import { ErrorState, LoadingGrid } from "../components/AsyncState";
import { PageTransition } from "../components/PageTransition";
import { api } from "../lib/api";
import { displayTitle, formatEpisodes, formatScore } from "../lib/format";
import { gsap, useGSAP } from "../lib/gsap";
import { pickRandomAnime, rememberRecentKey } from "../lib/random";

type DrawPhase = "idle" | "charging" | "shuffling" | "flipping" | "revealed";

function externalId(anime: AnimeSummary): string {
  return anime.key.split(":")[1] ?? "";
}

export default function RandomPage() {
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const season = useQuery({ queryKey: ["season"], queryFn: () => api.season() });
  const [phase, setPhase] = useState<DrawPhase>("idle");
  const [picked, setPicked] = useState<AnimeSummary | null>(null);
  const [drawToken, setDrawToken] = useState(0);
  const scopeRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rotationRef = useRef(0);

  const detail = useQuery({
    queryKey: ["anime", picked?.source, picked ? externalId(picked) : ""],
    queryFn: () => api.anime(picked!.source, externalId(picked!)),
    enabled: Boolean(picked),
  });

  const busy = phase === "charging" || phase === "shuffling" || phase === "flipping";

  useGSAP(
    () => {
      if (drawToken === 0 || !picked || reducedMotion) return;
      const currentRotation = rotationRef.current;
      const frontRotation = currentRotation === 0 ? 0 : currentRotation + 180;
      const backRotation = frontRotation + 540;
      rotationRef.current = backRotation;

      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          rememberRecentKey(picked.key);
          setPhase("revealed");
        },
      });

      timeline
        .to(cardRef.current, { rotationY: frontRotation, duration: 0.34, ease: "power2.inOut" })
        .to(buttonRef.current, { scale: 0.93, duration: 0.12 }, "<")
        .to(".draw-aura", { opacity: 1, scale: 1.12, duration: 0.36 }, "<")
        .call(() => setPhase("shuffling"))
        .to(cardRef.current, {
          keyframes: [
            { x: -16, rotation: -2.5 },
            { x: 16, rotation: 2.5 },
            { x: -10, rotation: -1.5 },
            { x: 10, rotation: 1.5 },
            { x: 0, rotation: 0 },
          ],
          duration: 0.82,
          ease: "power2.inOut",
        })
        .call(() => setPhase("flipping"))
        .to(cardRef.current, { rotationY: backRotation, scale: 1.05, duration: 1.05, ease: "power4.inOut" })
        .to(cardRef.current, { scale: 1, duration: 0.24 })
        .to(buttonRef.current, { scale: 1, duration: 0.2 }, "<")
        .to(".draw-aura", { opacity: 0, duration: 0.4 }, "<");

      return () => {
        timeline.kill();
      };
    },
    { scope: scopeRef, dependencies: [drawToken], revertOnUpdate: true },
  );

  const startDraw = () => {
    if (busy) return;
    const items = season.data?.items ?? [];
    const next = pickRandomAnime(items);
    if (!next) return;

    setPicked(next);
    setPhase("charging");
    setDrawToken((value) => value + 1);
    void queryClient.prefetchQuery({
      queryKey: ["anime", next.source, externalId(next)],
      queryFn: () => api.anime(next.source, externalId(next)),
    });

    if (reducedMotion) {
      rotationRef.current = 540;
      if (cardRef.current) gsap.set(cardRef.current, { rotationY: 540 });
      rememberRecentKey(next.key);
      setPhase("revealed");
    }
  };

  return (
    <PageTransition className="flex flex-1 flex-col">
      <section ref={scopeRef} className="px-4 pb-16 pt-14 sm:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-3xl space-y-5 text-center">
            <p className="text-xs tracking-[0.32em] text-neon-cyan uppercase">Random Draw</p>
            <h1 className="text-4xl font-black tracking-[-0.03em] sm:text-6xl">随机看番抽卡</h1>
            <p className="text-base leading-8 text-[var(--text-soft)]">
              从 {season.data?.label ?? "当季"} 的番剧池中随机抽取。图片、标题、评分和简介会在翻转结束后直接揭晓。
            </p>
          </div>

          {season.isError ? (
            <ErrorState message={season.error instanceof Error ? season.error.message : "抽卡池加载失败。"} onRetry={() => void season.refetch()} />
          ) : null}
          {season.isLoading ? <LoadingGrid count={3} /> : null}

          {season.data ? (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
              <div className="relative mx-auto w-full max-w-sm">
                <div className="card-scene">
                  <div ref={cardRef} className="card-flipper relative h-[30rem] w-full">
                    <div className="card-face card-face--front glass-panel-strong flex flex-col items-center justify-center gap-6 p-8 text-center">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(94,231,255,0.18),transparent_46%),radial-gradient(circle_at_50%_88%,rgba(255,79,216,0.16),transparent_46%)]" />
                      <span className="relative inline-flex size-24 items-center justify-center rounded-full border border-neon-cyan/30 bg-white/5 text-5xl font-black text-neon-cyan">
                        ?
                      </span>
                      <div className="relative space-y-2">
                        <p className="text-2xl font-black">命运卡牌</p>
                        <p className="text-sm text-[var(--text-soft)]">点击下方按钮，让雷达替你选一部。</p>
                      </div>
                    </div>
                    <div className="card-face card-face--back glass-panel-strong">
                      {picked?.cover ? (
                        <img src={picked.cover} alt={displayTitle(picked.title)} className="absolute inset-0 size-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/40 to-neon-cyan/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      <div className="relative flex h-full flex-col justify-end gap-3 p-7">
                        <span className="w-fit rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs text-white/80">
                          {picked?.source === "anilist" ? "AniList" : "Bangumi"}
                        </span>
                        <h2 className="text-3xl font-black leading-tight">{picked ? displayTitle(picked.title) : "等待揭晓"}</h2>
                        {picked?.score ? (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-neon-pink">
                            <Star className="size-4" />
                            {formatScore(picked.score)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="draw-aura" />
                <button
                  ref={buttonRef}
                  type="button"
                  className="neon-button relative z-10 mt-8 w-full px-6 py-4 text-base font-black disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={busy}
                  onClick={startDraw}
                >
                  {busy ? <Sparkles className="size-5 animate-spin" /> : phase === "revealed" ? <RotateCcw className="size-5" /> : <Sparkles className="size-5" />}
                  {phase === "charging"
                    ? "蓄能中…"
                    : phase === "shuffling"
                      ? "洗牌中…"
                      : phase === "flipping"
                        ? "翻卡中…"
                        : phase === "revealed"
                          ? "再抽一次"
                          : "开始抽卡"}
                </button>
              </div>

              <div aria-live="polite" className="min-h-72">
                {phase !== "revealed" ? (
                  <div className="glass-panel flex h-full min-h-72 flex-col items-center justify-center gap-4 rounded-[2rem] p-8 text-center text-[var(--text-soft)]">
                    <Sparkles className="size-10 text-neon-violet" />
                    <p>抽卡完成后，这里会展示番剧的完整详情。</p>
                  </div>
                ) : null}
                {phase === "revealed" && picked ? (
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
                    {detail.isLoading ? <LoadingGrid count={1} /> : null}
                    {detail.isError ? (
                      <ErrorState message={detail.error instanceof Error ? detail.error.message : "详情加载失败。"} onRetry={() => void detail.refetch()} />
                    ) : null}
                    {detail.data ? (
                      <article className="glass-panel space-y-6 rounded-[2rem] p-7">
                        <div className="space-y-3">
                          <p className="text-xs tracking-[0.28em] text-neon-pink uppercase">Revealed</p>
                          <h2 className="text-3xl font-black">{displayTitle(detail.data.title)}</h2>
                          <p className="text-sm text-[var(--text-soft)]">{detail.data.title.original}</p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{detail.data.status}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">评分 {formatScore(detail.data.score)}</span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                            <Clapperboard className="size-4" />
                            {formatEpisodes(detail.data.episodes)}
                          </span>
                          {detail.data.airDay ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/25 bg-neon-cyan/10 px-4 py-2 text-neon-cyan">
                              <CalendarDays className="size-4" />
                              {detail.data.airDay}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm leading-7 text-[var(--text-soft)]">{detail.data.synopsis ?? "暂无简介。"}</p>
                        {detail.data.genres.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {detail.data.genres.map((genre) => (
                              <span key={genre} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--text-soft)]">
                                {genre}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {detail.data.siteUrl ? (
                          <a href={detail.data.siteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-neon-cyan">
                            打开原始条目 <ExternalLink className="size-4" />
                          </a>
                        ) : null}
                      </article>
                    ) : null}
                  </motion.div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}