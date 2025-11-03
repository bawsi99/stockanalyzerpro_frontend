import React, { useEffect, useRef } from "react";

// Seamless crossfading video overlay to mimic provided style while hiding loop seams
// Renders two videos offset by half-duration and crossfades near edges.

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const HeroVideoOverlay: React.FC<{
  src: string;
  className?: string;
  fadeWindowSec?: number;
  blend?: "screen" | "lighten" | "overlay" | "normal";
}> = ({ src, className, fadeWindowSec = 0.6, blend = "screen" }) => {
  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);

  useEffect(() => {
    const a = aRef.current!;
    const b = bRef.current!;
    let mounted = true;

    const onMeta = () => {
      if (!mounted) return;
      const d = a.duration || b.duration || 0;
      if (!d || !isFinite(d)) return;
      durationRef.current = d;
      try { b.currentTime = (d / 2) % d; } catch {}
      a.play().catch(() => {});
      b.play().catch(() => {});
    };

    const onCanPlay = () => {
      if (!mounted) return;
      a.play().catch(() => {});
      b.play().catch(() => {});
    };

    a.addEventListener("loadedmetadata", onMeta);
    b.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("canplay", onCanPlay);
    b.addEventListener("canplay", onCanPlay);

    const loop = () => {
      const d = durationRef.current;
      if (d > 0) {
        const ta = a.currentTime % d;
        const tb = b.currentTime % d;
        const ea = Math.min(ta, d - ta);
        const eb = Math.min(tb, d - tb);
        const fa = 1 - smoothstep(0, fadeWindowSec, ea);
        const fb = 1 - smoothstep(0, fadeWindowSec, eb);
        const opa = 1 - fa; // full in middle, dips near edges
        const opb = 1 - fb;
        a.style.opacity = String(opa);
        b.style.opacity = String(opb);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      a.removeEventListener("loadedmetadata", onMeta);
      b.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("canplay", onCanPlay);
      b.removeEventListener("canplay", onCanPlay);
    };
  }, [src, fadeWindowSec]);

  return (
    <div className={className} style={{ mixBlendMode: blend === "normal" ? undefined : blend }}>
      <video ref={aRef} className="absolute inset-0 w-full h-full object-cover" src={src} muted playsInline autoPlay loop preload="auto" />
      <video ref={bRef} className="absolute inset-0 w-full h-full object-cover" src={src} muted playsInline autoPlay loop preload="auto" />
    </div>
  );
};

export default HeroVideoOverlay;
