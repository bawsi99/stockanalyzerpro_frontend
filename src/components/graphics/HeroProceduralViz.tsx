import React, { useEffect, useRef } from "react";

// Procedural, seamless animation for hero section (no video)
// - Fluid additive blobs drawn as radial gradients
// - Subtle drift to avoid visible loops
// - Respects prefers-reduced-motion
// - Auto-resizes to container

const usePrefersReducedMotion = () => {
  const prefers = useRef<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefers.current = m.matches;
    const listener = () => (prefers.current = m.matches);
    try {
      m.addEventListener?.("change", listener);
    } catch {
      m.addListener?.(listener as any);
    }
    return () => {
      try {
        m.removeEventListener?.("change", listener);
      } catch {
        m.removeListener?.(listener as any);
      }
    };
  }, []);
  return prefers;
};

export const HeroProceduralViz: React.FC<{
  className?: string;
  intensity?: number; // 0..1
}> = ({ className, intensity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const resize = () => {
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${Math.max(1, Math.floor(width))}px`;
      canvas.style.height = `${Math.max(1, Math.floor(height))}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const RO: any = (window as any).ResizeObserver;
    const ro = RO ? new RO(() => resize()) : undefined;
    ro?.observe?.(wrapper);

    // Blob params
    const blobs = Array.from({ length: 4 }).map((_, i) => ({
      baseX: 0.5 + 0.25 * Math.cos(i * 1.2),
      baseY: 0.5 + 0.25 * Math.sin(i * 1.2),
      r: 220 + 60 * Math.sin(i * 0.7),
      hue: 205 + 25 * Math.sin(i * 0.9),
      sat: 95 - 18 * (i % 2),
      alpha: 0.18 + 0.06 * (i % 3),
      speed: 0.6 + 0.2 * (i % 3),
    }));

    const t0 = performance.now();
    const draw = () => {
      if (!running) return;
      const now = performance.now();
      const t = (now - t0) / 1000; // seconds
      const { width, height } = wrapper.getBoundingClientRect();

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const b of blobs) {
        const wobX = 0.18 * Math.sin(t * b.speed + b.r * 0.002);
        const wobY = 0.18 * Math.cos(t * b.speed * 0.92 + b.r * 0.003);
        const cx = (b.baseX + wobX * 0.5) * width;
        const cy = (b.baseY + wobY * 0.5) * height;
        const r = Math.min(width, height) * (b.r / 1000);

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const a = Math.max(0, Math.min(1, b.alpha * intensity));
        g.addColorStop(0, `hsla(${b.hue} ${b.sat}% 65% / ${a})`);
        g.addColorStop(0.5, `hsla(${b.hue} ${Math.max(65, b.sat)}% 55% / ${a * 0.6})`);
        g.addColorStop(1, `hsla(${b.hue} ${b.sat}% 50% / 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle vignette to blend edges
      const vg = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.45, width / 2, height / 2, Math.min(width, height) * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "source-over";

      if (!reduced.current) {
        raf = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect?.();
    };
  }, [intensity, reduced]);

  return (
    <div ref={wrapperRef} className={className}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default HeroProceduralViz;
