import { useEffect, useMemo, useRef, useState } from "react";

interface Rect { x: number; y: number; width: number; height: number }

interface NetworkGraphProps {
  className?: string;
  nodeColor?: string; // css color
  lineColor?: string; // css color
  nodes?: number; // approximate number of nodes
  animated?: boolean;
  avoidRef?: React.RefObject<HTMLElement> | React.RefObject<HTMLElement>[]; // areas to avoid (text/content)
  avoidPadding?: number; // px
}

// Lightweight decorative network graph (nodes + edges) suitable for backgrounds
export const NetworkGraph = ({
  className = "",
  nodeColor = "hsl(var(--accent))",
  lineColor = "hsl(var(--accent) / 0.35)",
  nodes = 28,
  animated = true,
  avoidRef,
  avoidPadding = 24,
}: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [avoidRects, setAvoidRects] = useState<Rect[]>([]);

  // Track container size with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) });
    };
    update();
    const ro = new (window as any).ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect?.();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Compute rects to avoid, relative to this container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const base = el.getBoundingClientRect();
    const refs = Array.isArray(avoidRef) ? avoidRef : avoidRef ? [avoidRef] : [];
    const rects: Rect[] = [];
    refs.forEach((r) => {
      const node = r?.current as HTMLElement | null;
      if (!node) return;
      const cr = node.getBoundingClientRect();
      const rect: Rect = {
        x: Math.max(0, Math.round(cr.left - base.left) - avoidPadding),
        y: Math.max(0, Math.round(cr.top - base.top) - avoidPadding),
        width: Math.min(Math.round(cr.width) + avoidPadding * 2, Math.round(base.width)),
        height: Math.min(Math.round(cr.height) + avoidPadding * 2, Math.round(base.height)),
      };
      rects.push(rect);
    });
    setAvoidRects(rects);
  }, [avoidRef, size.width, size.height, avoidPadding]);

  // Deterministic pseudo-random with rejection sampling to avoid content rects
  const points = useMemo(() => {
    const count = nodes;
    const w = Math.max(size.width, 1);
    const h = Math.max(size.height, 1);
    let seed = 12345;
    const rand = () => {
      seed = (1103515245 * seed + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const insideAny = (x: number, y: number) =>
      avoidRects.some((r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);

    const pts: Array<{ x: number; y: number }> = [];
    let attempts = 0;
    const maxAttempts = count * 40; // generous to ensure fill
    while (pts.length < count && attempts < maxAttempts) {
      attempts++;
      const x = Math.round(rand() * w);
      const y = Math.round(rand() * h);
      if (!insideAny(x, y)) pts.push({ x, y });
    }
    // If we couldn't place enough points (e.g., content covers most area), keep what we have

    // connect each point to its 2 nearest neighbors
    const edges: Array<[number, number]> = [];
    pts.forEach((p, i) => {
      const dists = pts
        .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      dists.forEach(({ j }) => edges.push([i, j]));
    });
    return { pts, edges, w, h };
  }, [size.width, size.height, nodes, avoidRects]);

  // Gentle float animation
  const float = animated ? {
    animation: "networkFloat 12s ease-in-out infinite alternate",
  } : undefined;

  return (
    <div ref={containerRef} className={className} aria-hidden>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${points.w} ${points.h}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>
            {`
            @keyframes networkFloat {
              0% { transform: translateY(0px); }
              100% { transform: translateY(-6px); }
            }
          `}
          </style>
        </defs>

        <g style={float}>
          {/* edges */}
          <g stroke={lineColor} strokeWidth={1.25} strokeLinecap="round" strokeOpacity={0.6}>
            {points.edges.map(([a, b], i) => (
              <line
                key={i}
                x1={points.pts[a].x}
                y1={points.pts[a].y}
                x2={points.pts[b].x}
                y2={points.pts[b].y}
              />
            ))}
          </g>

          {/* nodes */}
          <g fill={nodeColor} filter="url(#glow)">
            {points.pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3} opacity={0.9} />)
            )}
          </g>
        </g>

        {/* vignette */}
        <rect x="0" y="0" width={points.w} height={points.h} fill="url(#fade)" pointerEvents="none" />
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
            <stop offset="30%" stopColor="rgba(0,0,0,0.0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
