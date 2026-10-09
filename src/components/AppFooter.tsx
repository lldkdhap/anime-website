export function AppFooter() {
  return (
    <footer className="mt-auto px-4 pb-6 pt-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[var(--text-soft)] sm:flex-row sm:items-center sm:justify-between">
        <p>Anime Radar · 数据来自 Bangumi、AniList 与公开 RSS，仅供个人学习使用。</p>
        <p>动画由 Motion、GSAP 与 tsParticles 驱动。</p>
      </div>
    </footer>
  );
}