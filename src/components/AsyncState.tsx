import { RefreshCw, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export function LoadingScreen() {
  return (
    <div className="flex min-h-[52vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-[var(--text-soft)]">
        <motion.span
          className="inline-flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Sparkles className="size-6 text-neon-cyan" />
        </motion.span>
        <span className="text-sm tracking-[0.28em] uppercase">Loading radar</span>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton h-72 rounded-[1.75rem]" />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="glass-panel flex min-h-64 flex-col items-center justify-center gap-4 rounded-[2rem] p-8 text-center">
      <p className="max-w-md text-base text-[var(--text-soft)]">{message}</p>
      {onRetry ? (
        <button type="button" className="neon-button px-5 py-3 text-sm font-semibold" onClick={onRetry}>
          <RefreshCw className="size-4" />
          重新加载
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-panel flex min-h-56 items-center justify-center rounded-[2rem] p-8 text-center text-[var(--text-soft)]">
      {message}
    </div>
  );
}