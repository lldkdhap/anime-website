import { Radar, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Link, NavLink } from "react-router";

const navItems = [
  { to: "/", label: "雷达" },
  { to: "/news", label: "新番资讯" },
  { to: "/random", label: "随机看番" },
] as const;

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full border border-neon-cyan/40 bg-neon-cyan/10">
            <Radar className="size-5 text-neon-cyan" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-[0.24em] text-white uppercase">Anime Radar</span>
            <span className="block text-xs text-[var(--text-soft)]">新番雷达 · 随机看番</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              {({ isActive }) => (
                <span className="relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--text-soft)] transition-colors hover:text-white">
                  {isActive ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full border border-neon-cyan/30 bg-neon-cyan/10"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  ) : null}
                  {item.to === "/random" ? <Sparkles className="relative z-10 size-4" /> : null}
                  <span className={isActive ? "relative z-10 text-white" : "relative z-10"}>{item.label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}