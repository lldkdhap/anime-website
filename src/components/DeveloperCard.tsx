import { Sparkles } from "lucide-react";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4 shrink-0">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.54-.01 2.78-.01 3.16 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function ButterflyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <path d="M12 7.5c-1.2-2.4-3.2-4-5.1-4C4.7 3.5 3.5 5.2 3.5 7.4c0 3.8 3.5 6.1 8.5 5.1" />
      <path d="M12 7.5c1.2-2.4 3.2-4 5.1-4 2.2 0 3.4 1.7 3.4 3.9 0 3.8-3.5 6.1-8.5 5.1" />
      <path d="M12 12.5c-1 2.2-2.7 3.8-4.4 4.4-1.6.6-2.7-.4-2.7-1.9 0-2.2 2.5-3.9 7.1-3.4" />
      <path d="M12 12.5c1 2.2 2.7 3.8 4.4 4.4 1.6.6 2.7-.4 2.7-1.9 0-2.2-2.5-3.9-7.1-3.4" />
      <path d="M12 7.5v9" />
      <path d="M10.5 5.5 9 3.5M13.5 5.5 15 3.5" />
    </svg>
  );
}

export function DeveloperCard() {
  return (
    <aside className="dev-card glass-panel w-full max-w-xl rounded-[1.5rem] px-4 py-3.5 text-[11px] leading-5 text-[var(--text-soft)] sm:text-xs">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] text-neon-cyan uppercase">
        <Sparkles className="size-3.5" />
        <span>◇ Dev Profile ◇</span>
      </div>
      <p className="mt-2 text-white/90">
        开发者：<span className="text-neon-cyan">LHF</span> <span className="text-white/30">｜</span> 某北信科的路人甲
      </p>
      <p className="mt-1">本动漫雷达网站由个人独立构思，从零搭建完成。聚合了新番资讯、随机看番与一些动效。</p>
      <p className="mt-1 text-white/70">愿你在这里能发现新的天地～</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href="https://github.com/lldkdhap"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-[var(--text-soft)] transition duration-200 hover:scale-[1.02] hover:border-neon-cyan/40 hover:text-neon-cyan hover:shadow-[0_0_18px_rgba(94,231,255,0.18)]"
        >
          <GithubIcon />
          <span>Github个人主页</span>
          <span aria-hidden="true">↗</span>
        </a>
        <a
          href="https://lldkdhap.github.io/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-[var(--text-soft)] transition duration-200 hover:scale-[1.02] hover:border-neon-pink/40 hover:text-neon-pink hover:shadow-[0_0_18px_rgba(255,79,216,0.16)]"
        >
          <ButterflyIcon />
          <span>个人博客</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className="mt-3 border-t border-white/8 pt-2 text-[10px] text-white/45">© 2026 动漫雷达 ｜ 使用 Vibe Coding 创作</p>
    </aside>
  );
}