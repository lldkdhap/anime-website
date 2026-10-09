import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const reducedMotion = useReducedMotion();
  const hidden = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 26, clipPath: "inset(0 0 12% 0 round 28px)" };
  const visible = reducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0 round 28px)" };
  const exit = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -18, clipPath: "inset(0 0 10% 0 round 28px)" };

  return (
    <motion.main
      className={className}
      initial={hidden}
      animate={visible}
      exit={exit}
      transition={reducedMotion ? { duration: 0.18 } : { duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}