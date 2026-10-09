import { useEffect } from "react";

export function CursorGlow() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.18;

    const paint = () => {
      frame = 0;
      document.documentElement.style.setProperty("--cursor-x", `${x}px`);
      document.documentElement.style.setProperty("--cursor-y", `${y}px`);
    };

    const onPointerMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (frame === 0) frame = window.requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="cursor-glow" aria-hidden="true" />;
}