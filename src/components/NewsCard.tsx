import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import type { NewsItem } from "../../shared/contracts";
import { formatDateTime } from "../lib/format";
import { TiltCard } from "./TiltCard";

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

export function NewsCard({ item, index }: NewsCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ delay: Math.min(index * 0.06, 0.42), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="masonry-item"
    >
      <TiltCard>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="glass-panel group block overflow-hidden rounded-[1.6rem] transition duration-300 hover:border-neon-cyan/35"
        >
          {item.image ? (
            <div className="aspect-[16/9] overflow-hidden bg-white/5">
              <img
                src={item.image}
                alt=""
                loading="lazy"
                className="size-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          ) : null}
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-soft)]">
              <span className="rounded-full border border-neon-pink/30 bg-neon-pink/10 px-2.5 py-1 text-neon-pink">{item.source}</span>
              <span>{formatDateTime(item.publishedAt)}</span>
            </div>
            <h3 className="line-clamp-2 text-lg font-bold leading-snug group-hover:text-neon-cyan">{item.title}</h3>
            <p className="line-clamp-3 text-sm leading-6 text-[var(--text-soft)]">{item.excerpt}</p>
            <span className="inline-flex items-center gap-1 text-xs text-neon-cyan">
              阅读原文
              <ExternalLink className="size-3" />
            </span>
          </div>
        </a>
      </TiltCard>
    </motion.article>
  );
}