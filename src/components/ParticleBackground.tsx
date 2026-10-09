import type { Engine, ISourceOptions } from "@tsparticles/engine";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useMemo, useState } from "react";

interface ParticleBackgroundProps {
  mode: "full" | "subtle";
}

async function initEngine(engine: Engine): Promise<void> {
  await loadSlim(engine);
}

function shouldDisableParticles(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 767px)").matches
  );
}

export function ParticleBackground({ mode }: ParticleBackgroundProps) {
  const [disabled, setDisabled] = useState(() => shouldDisableParticles());

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setDisabled(motionQuery.matches || sizeQuery.matches);
    update();
    motionQuery.addEventListener("change", update);
    sizeQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      sizeQuery.removeEventListener("change", update);
    };
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      detectRetina: true,
      fpsLimit: 60,
      particles: {
        number: {
          value: mode === "full" ? 52 : 20,
          density: { enable: true, width: 1200, height: 800 },
        },
        color: { value: ["#5ee7ff", "#ff4fd8", "#8b5cf6"] },
        links: {
          enable: true,
          color: "#8b5cf6",
          distance: 145,
          opacity: 0.16,
          width: 1,
        },
        move: {
          enable: true,
          speed: mode === "full" ? 0.72 : 0.34,
          outModes: { default: "out" },
        },
        opacity: { value: { min: 0.12, max: 0.42 } },
        size: { value: { min: 1, max: 3 } },
        shape: { type: "circle" },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          onClick: { enable: true, mode: "push" },
          resize: { enable: true },
        },
        modes: {
          repulse: { distance: 110, duration: 0.4, speed: 1 },
          push: { quantity: 2 },
        },
      },
    }),
    [mode],
  );

  if (disabled) return null;

  return (
    <div className="particles-layer" aria-hidden="true">
      <ParticlesProvider init={initEngine}>
        <Particles id="anime-radar-particles" options={options} />
      </ParticlesProvider>
    </div>
  );
}