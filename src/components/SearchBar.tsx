import { LoaderCircle, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { searchAniList, type AniListSearchItem } from "../lib/anilist";
import { formatScore } from "../lib/format";

type SearchStatus = "idle" | "loading" | "success" | "error";

interface SearchBarProps {
  className?: string;
}

function resultTitle(item: AniListSearchItem): string {
  return item.title?.english ?? item.title?.romaji ?? item.title?.native ?? "未知作品";
}

function secondaryTitle(item: AniListSearchItem): string | undefined {
  const title = resultTitle(item);
  const secondary = item.title?.romaji ?? item.title?.native;
  return secondary && secondary !== title ? secondary : undefined;
}

function statusLabel(status: string | null | undefined): string | undefined {
  switch (status) {
    case "RELEASING":
      return "连载中";
    case "FINISHED":
      return "已完结";
    case "NOT_YET_RELEASED":
      return "未开播";
    case "CANCELLED":
      return "已取消";
    case "HIATUS":
      return "停更";
    default:
      return undefined;
  }
}

export function SearchBar({ className = "" }: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListSearchItem[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const search = query.trim();
    if (!search) {
      abortRef.current?.abort();
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");

      searchAniList(search, controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          setResults(items);
          setStatus("success");
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (error instanceof Error && error.name === "AbortError") return;
          setResults([]);
          setStatus("error");
        });
    }, 500);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const summary =
    status === "loading"
      ? "正在搜索…"
      : status === "error"
        ? "搜索失败，请稍后重试。"
        : status === "success" && results.length === 0
          ? "没有找到相关番剧，换个关键词试试？"
          : status === "success"
            ? `找到 ${results.length} 条结果`
            : "输入关键词开始搜索…";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="glass-panel flex items-center gap-2 rounded-full px-3 py-2">
        <Search className="size-4 shrink-0 text-[var(--text-soft)]" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-label="搜索番剧"
          aria-expanded={open}
          aria-controls="anime-search-results"
          aria-autocomplete="list"
          value={query}
          placeholder="搜索番剧..."
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setOpen(Boolean(value.trim()));
            setStatus("idle");
            setResults([]);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              event.currentTarget.blur();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-soft)]/70"
        />
        {status === "loading" ? (
          <motion.span
            className="inline-flex shrink-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <LoaderCircle className="size-4 text-neon-cyan" aria-hidden="true" />
          </motion.span>
        ) : null}
      </div>

      <AnimatePresence>
        {open && query.trim() ? (
          <motion.div
            id="anime-search-results"
            role="listbox"
            aria-label="番剧搜索结果"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel-strong absolute left-0 top-[calc(100%+0.6rem)] z-50 w-[min(46rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] p-3"
          >
            <p aria-live="polite" className="px-2 pb-2 text-xs text-[var(--text-soft)]">
              {summary}
            </p>
            {status === "success" && results.length > 0 ? (
              <div className="grid max-h-[65vh] gap-2 overflow-y-auto sm:grid-cols-2">
                {results.map((item, index) => {
                  const title = resultTitle(item);
                  const subtitle = secondaryTitle(item);
                  const cover = item.coverImage?.large ?? item.coverImage?.medium;
                  const statusText = statusLabel(item.status);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.28 }}
                    >
                      <Link
                        to={`/anime/anilist/${item.id}`}
                        role="option"
                        aria-selected={false}
                        onClick={() => setOpen(false)}
                        className="group flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 transition hover:border-neon-cyan/30 hover:bg-white/[0.06]"
                      >
                        {cover ? (
                          <img src={cover} alt="" className="h-20 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
                        ) : (
                          <div className="h-20 w-14 shrink-0 rounded-xl bg-gradient-to-br from-neon-violet/30 to-neon-cyan/20" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold leading-snug text-white group-hover:text-neon-cyan">{title}</p>
                          {subtitle ? <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-soft)]">{subtitle}</p> : null}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-soft)]">
                            <span className="text-neon-pink">★ {formatScore(item.averageScore ?? undefined)}</span>
                            {statusText ? <span>{statusText}</span> : null}
                            {item.episodes ? <span>{item.episodes} 集</span> : null}
                          </div>
                          {item.genres && item.genres.length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {item.genres.slice(0, 2).map((genre) => (
                                <span key={genre} className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-[var(--text-soft)]">
                                  {genre}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}