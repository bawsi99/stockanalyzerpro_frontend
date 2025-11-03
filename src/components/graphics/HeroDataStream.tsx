import React, { useEffect, useRef } from "react";

// Animated data stream overlay: flowing digits and mini graph lines left->right
// Drawn on a transparent canvas to layer above the blob viz and beneath the brain icon.

const usePrefersReducedMotion = () => {
  const ref = useRef(false);
  useEffect(() => {
    const m = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (!m) return;
    ref.current = m.matches;
    const onChange = () => (ref.current = m.matches);
    try { m.addEventListener('change', onChange); } catch { m.addListener?.(onChange as any); }
    return () => { try { m.removeEventListener('change', onChange); } catch { m.removeListener?.(onChange as any); } };
  }, []);
  return ref;
};

export const HeroDataStream: React.FC<{ className?: string }>= ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      canvas.style.width = `${Math.max(1, Math.floor(r.width))}px`;
      canvas.style.height = `${Math.max(1, Math.floor(r.height))}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const RO: any = (window as any).ResizeObserver;
    const ro = RO ? new RO(() => resize()) : undefined;
    ro?.observe?.(wrap);

    // Build digit particles
    const glyphs = '0123456789%+−×•';
    type Digit = { x: number; y: number; vy: number; vx: number; size: number; hue: number; alpha: number; wob: number; lane: number };
    const digits: Digit[] = [];

    const lanes = 7; // vertical bands for consistency
    const spawnDigits = (width: number, height: number) => {
      digits.length = 0;
      for (let i = 0; i < 60; i++) {
        const lane = Math.floor(Math.random() * lanes);
        const y = (height * (0.25 + 0.5 * (lane / (lanes - 1)))) + (Math.random() - 0.5) * 20;
        digits.push({
          x: -Math.random() * width,
          y,
          vx: 60 + Math.random() * 120,
          vy: (Math.random() - 0.5) * 6,
          size: 12 + Math.random() * 10,
          hue: 190 + Math.random() * 40,
          alpha: 0.35 + Math.random() * 0.3,
          wob: Math.random() * Math.PI * 2,
          lane
        });
      }
    };

    // Graph trails (polyline waves)
    type Trail = { x: number; y: number; len: number; amp: number; freq: number; speed: number; hue: number; alpha: number };
    const trails: Trail[] = [];
    const spawnTrails = (width: number, height: number) => {
      trails.length = 0;
      for (let i = 0; i < 10; i++) {
        const y = height * (0.25 + 0.5 * (i / 9));
        trails.push({
          x: -Math.random() * width,
          y,
          len: 220 + Math.random() * 260,
          amp: 14 + Math.random() * 22,
          freq: 0.02 + Math.random() * 0.05,
          speed: 120 + Math.random() * 180,
          hue: 198 + Math.random() * 30,
          alpha: 0.5 + Math.random() * 0.25,
        });
      }
    };

    // Candlestick glyphs (mini charts)
    type Candle = { x: number; y: number; w: number; speed: number; dir: 1 | -1; hue: number; alpha: number; base: number; amp: number; t: number };
    const candles: Candle[] = [];
    const spawnCandles = (width: number, height: number) => {
      candles.length = 0;
      for (let i = 0; i < 28; i++) {
        const lane = Math.floor(Math.random() * 8);
        const y = height * (0.28 + 0.44 * (lane / 7));
        candles.push({
          x: -Math.random() * width,
          y,
          w: 6 + Math.random() * 4,
          speed: 100 + Math.random() * 140,
          dir: Math.random() > 0.5 ? 1 : -1,
          hue: 200 + Math.random() * 20,
          alpha: 0.55,
          base: y,
          amp: 14 + Math.random() * 16,
          t: Math.random() * Math.PI * 2,
        });
      }
    };

    const init = () => {
      const r = wrap.getBoundingClientRect();
      spawnDigits(r.width, r.height);
      spawnTrails(r.width, r.height);
      spawnCandles(r.width, r.height);
    };
    init();

    let raf = 0;
    let t0 = performance.now();
    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      const r = wrap.getBoundingClientRect();

      ctx.clearRect(0, 0, r.width, r.height);

      // Trails first
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const tr of trails) {
        tr.x += tr.speed * dt;
        if (tr.x - tr.len > r.width + 40) tr.x = -tr.len - 40;
        ctx.lineWidth = 2.5;
        const grad = ctx.createLinearGradient(tr.x, tr.y, tr.x + tr.len, tr.y);
        grad.addColorStop(0, `hsla(${tr.hue} 95% 70% / 0)`);
        grad.addColorStop(0.12, `hsla(${tr.hue} 98% 70% / ${tr.alpha * 0.35})`);
        grad.addColorStop(0.5, `hsla(${tr.hue} 100% 70% / ${tr.alpha})`);
        grad.addColorStop(0.88, `hsla(${tr.hue} 98% 70% / ${tr.alpha * 0.35})`);
        grad.addColorStop(1, `hsla(${tr.hue} 95% 70% / 0)`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        const segments = 56;
        for (let i = 0; i <= segments; i++) {
          const x = tr.x + (i / segments) * tr.len;
          const y = tr.y + Math.sin((i * tr.freq) + now * 0.002) * tr.amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Candlestick glyphs next
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const c of candles) {
        c.x += c.speed * dt;
        c.t += dt * 1.5;
        if (c.x > r.width + 20) {
          c.x = -40;
          c.t = 0;
        }
        const base = c.base + Math.sin(c.t * 1.2) * (c.amp * 0.25);
        const o = base + Math.sin(c.t * 2.1) * c.amp * 0.4;
        const cl = base + Math.sin(c.t * 2.1 + 0.8 * c.dir) * c.amp * 0.4;
        const hi = Math.max(o, cl) + 8 + Math.sin(c.t * 3.2) * 3;
        const lo = Math.min(o, cl) - 8 + Math.cos(c.t * 2.7) * 3;
        const up = cl >= o;
        const bodyTop = up ? cl : o;
        const bodyBot = up ? o : cl;
        const color = up ? `hsla(150 90% 70% / ${c.alpha})` : `hsla(0 90% 70% / ${c.alpha})`;
        const glow = up ? `hsla(150 95% 70% / ${c.alpha * 0.5})` : `hsla(0 95% 70% / ${c.alpha * 0.5})`;

        // Wick
        ctx.strokeStyle = glow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(c.x, hi);
        ctx.lineTo(c.x, lo);
        ctx.stroke();

        // Body (with slight glow)
        ctx.fillStyle = color;
        const bw = c.w;
        ctx.fillRect(c.x - bw / 2, bodyBot, bw, Math.max(1, bodyTop - bodyBot));
      }
      ctx.restore();

      // Digits on top of trails and candles
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.textBaseline = 'middle';
      for (const d of digits) {
        d.x += d.vx * dt;
        d.y += d.vy * dt + Math.sin((now * 0.002) + d.wob) * 0.2;
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)] ?? '0';
        if (d.x > r.width + 20) {
          d.x = -40;
          d.y = r.height * (0.3 + 0.4 * (d.lane / (lanes - 1))) + (Math.random() - 0.5) * 20;
        }
        ctx.font = `${Math.round(d.size)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
        // Outer faint glow
        ctx.fillStyle = `hsla(${d.hue} 95% 75% / ${d.alpha * 0.35})`;
        ctx.fillText(ch, d.x, d.y);
        // Core bright
        ctx.fillStyle = `hsla(${d.hue} 100% 80% / ${d.alpha})`;
        ctx.fillText(ch, d.x + 0.5, d.y + 0.5);
      }
      ctx.restore();

      // Edge fade for cohesion
      const g = ctx.createLinearGradient(0, 0, r.width, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.35)');
      g.addColorStop(0.08, 'rgba(0,0,0,0)');
      g.addColorStop(0.92, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.globalCompositeOperation = 'source-over';

      if (!reduced.current) raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (raf) cancelAnimationFrame(raf); ro?.disconnect?.(); };
  }, [reduced]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default HeroDataStream;
