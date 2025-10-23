import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TechnicalAnalysisCard } from "@/components/multi-agent/TechnicalAnalysisCard";
import { FundamentalAnalysisCard } from "@/components/multi-agent/FundamentalAnalysisCard";
import { MarketIntelligenceCard } from "@/components/multi-agent/MarketIntelligenceCard";
import { PortfolioManagementCard } from "@/components/multi-agent/PortfolioManagementCard";
import { TradingAgentCard } from "@/components/multi-agent/TradingAgentCard";

interface Point { x: number; y: number }
interface Edge { from: Point; to: Point }

const useConnectorPositions = (refs: React.RefObject<HTMLElement>[], containerRef: React.RefObject<HTMLDivElement>) => {
  const [edges, setEdges] = useState<Edge[]>([]);

  useLayoutEffect(() => {
    const update = () => {
      const container = containerRef.current;
      if (!container) return;
      const base = container.getBoundingClientRect();

      const [tech, fundamental, market, portfolio, trading] = refs.map(r => r.current as HTMLElement | null);
      if (!tech || !fundamental || !market || !portfolio || !trading) return;

      const rectOf = (el: HTMLElement) => el.getBoundingClientRect();
      const centerLeft = (r: DOMRect): Point => ({ x: r.left - base.left, y: r.top + r.height / 2 - base.top });
      const centerRight = (r: DOMRect): Point => ({ x: r.left + r.width - base.left, y: r.top + r.height / 2 - base.top });

      const techR = rectOf(tech);
      const fundR = rectOf(fundamental);
      const marketR = rectOf(market);
      const portR = rectOf(portfolio);
      const tradeR = rectOf(trading);

      const newEdges: Edge[] = [
        { from: centerRight(techR), to: centerLeft(portR) },
        { from: centerRight(fundR), to: centerLeft(portR) },
        { from: centerRight(marketR), to: centerLeft(portR) },
        { from: centerRight(portR), to: centerLeft(tradeR) },
      ];

      console.log('=== MultiAgent Debug ===');
      console.log('Container rect:', base);
      console.log('Tech rect:', techR);
      console.log('Fund rect:', fundR);
      console.log('Market rect:', marketR);
      console.log('Portfolio rect:', portR);
      console.log('Trading rect:', tradeR);
      console.log('Edges:', newEdges);
      console.log('SVG size:', { w: base.width, h: base.height });

      setEdges((prev) => {
        const same = prev.length === newEdges.length && prev.every((e, i) => e.from.x === newEdges[i].from.x && e.from.y === newEdges[i].from.y && e.to.x === newEdges[i].to.x && e.to.y === newEdges[i].to.y);
        return same ? prev : newEdges;
      });
    };

    update();
    const RO: typeof ResizeObserver | undefined = typeof window !== "undefined" ? (window as any).ResizeObserver : undefined;
    let ro: ResizeObserver | undefined;
    if (RO) {
      ro = new RO(() => update());
      refs.forEach((r) => {
        if (r.current) ro!.observe(r.current);
      });
      if (containerRef.current) ro.observe(containerRef.current);
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [containerRef]);

  return edges;
};

export const MultiAgentFlow = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const techRef = useRef<HTMLDivElement | null>(null);
  const fundamentalRef = useRef<HTMLDivElement | null>(null);
  const marketRef = useRef<HTMLDivElement | null>(null);
  const portfolioRef = useRef<HTMLDivElement | null>(null);
  const tradingRef = useRef<HTMLDivElement | null>(null);

  const agentRefs = useMemo(() => [
    techRef as unknown as React.RefObject<HTMLElement>,
    fundamentalRef as unknown as React.RefObject<HTMLElement>,
    marketRef as unknown as React.RefObject<HTMLElement>,
    portfolioRef as unknown as React.RefObject<HTMLElement>,
    tradingRef as unknown as React.RefObject<HTMLElement>,
  ], []);

  const edges = useConnectorPositions(
    agentRefs,
    containerRef as React.RefObject<HTMLDivElement>
  );

  console.log('=== Render Debug ===');
  console.log('Edges count:', edges.length);
  console.log('SVG size state:', size);
  console.log('Container ref:', containerRef.current);

  // Compute an SVG viewBox that matches container
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) });
    };
    update();
    const RO: typeof ResizeObserver | undefined = typeof window !== "undefined" ? (window as any).ResizeObserver : undefined;
    let ro: ResizeObserver | undefined;
    if (RO) {
      ro = new RO(() => update());
      ro.observe(el);
    }
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect?.();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section className="py-24 px-0 md:px-0 relative overflow-visible w-full">
      <div className="mx-auto max-w-[1600px] w-full relative px-0 md:px-2">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">Multi-Agent Flow</h2>
          <p className="text-muted-foreground">End-to-end flow from analysis to execution</p>
        </div>

        <div ref={containerRef} className="relative">
          {/* SVG connectors */}
          <svg className="absolute inset-0 pointer-events-none z-50" width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" style={{border: '1px solid red'}}>
            <defs>
              <marker id="arrow" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="#FFD700" />
              </marker>
              <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {edges.map((e, i) => (
              <g key={i}>
                {/* Debug circles to show connection points */}
                <circle cx={e.from.x} cy={e.from.y} r="3" fill="red" />
                <circle cx={e.to.x} cy={e.to.y} r="3" fill="blue" />
                <path
                  d={`M ${e.from.x} ${e.from.y} C ${(e.from.x + e.to.x) / 2} ${e.from.y}, ${(e.from.x + e.to.x) / 2} ${e.to.y}, ${e.to.x} ${e.to.y}`}
                  stroke="#FFD700"
                  strokeWidth={5}
                  fill="none"
                  markerEnd="url(#arrow)"
                  opacity={1}
                />
              </g>
            ))}
          </svg>

          {/* Grid layout: 3 columns, arrows flow left -> right */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Column 1: stacked analysis agents */}
            <div className="flex flex-col gap-6">
              <div ref={techRef}>
                <TechnicalAnalysisCard />
              </div>
              <div ref={fundamentalRef}>
                <FundamentalAnalysisCard />
              </div>
              <div ref={marketRef}>
                <MarketIntelligenceCard />
              </div>
            </div>

            {/* Column 2: portfolio centered vertically */}
            <div className="flex items-center">
              <div className="w-full" ref={portfolioRef}>
                <PortfolioManagementCard />
              </div>
            </div>

            {/* Column 3: trading centered vertically */}
            <div className="flex items-center">
              <div className="w-full" ref={tradingRef}>
                <TradingAgentCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
