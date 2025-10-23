import { useElementAnimation } from "@/hooks/use-element-animation";
import { NetworkGraph } from "@/components/graphics/NetworkGraph";
import { useRef, useLayoutEffect, useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import { TechnicalAnalysisCard } from "@/components/multi-agent/TechnicalAnalysisCard";
import { FundamentalAnalysisCard } from "@/components/multi-agent/FundamentalAnalysisCard";
import { MarketIntelligenceCard } from "@/components/multi-agent/MarketIntelligenceCard";
import { PortfolioManagementCard } from "@/components/multi-agent/PortfolioManagementCard";
import { TradingAgentCard } from "@/components/multi-agent/TradingAgentCard";

const Solution = () => {
  const headerAnimation = useElementAnimation({
    minY: 25,
    maxY: 75,
    maxScale: 1.05,
    minScale: 0.92,
  });
  
  
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Scroll animations for inline multi-agent cards
  const techAnim = useElementAnimation({ minY: 25, maxY: 75, maxScale: 1.08, minScale: 0.9 });
  const fundAnim = useElementAnimation({ minY: 25, maxY: 75, maxScale: 1.08, minScale: 0.9 });
  const marketAnim = useElementAnimation({ minY: 25, maxY: 75, maxScale: 1.08, minScale: 0.9 });
  const portfolioAnim = useElementAnimation({ minY: 25, maxY: 75, maxScale: 1.08, minScale: 0.9 });
  const tradingAnim = useElementAnimation({ minY: 25, maxY: 75, maxScale: 1.08, minScale: 0.9 });

  // Dynamic arrow between Portfolio and Trading (edge-to-edge)
  const inlineFlowRef = useRef<HTMLDivElement | null>(null);
  const portfolioEdgeRef = useRef<HTMLDivElement | null>(null);
  const tradingEdgeRef = useRef<HTMLDivElement | null>(null);
  const [arrowD, setArrowD] = useState("");
  const [arrowThickness, setArrowThickness] = useState(3);

  useLayoutEffect(() => {
    const update = () => {
      const base = inlineFlowRef.current?.getBoundingClientRect();
      const p = portfolioEdgeRef.current?.getBoundingClientRect();
      const t = tradingEdgeRef.current?.getBoundingClientRect();
      if (!base || !p || !t) return;
      // Calculate arrow positions from card edges
      const fromX = (p.left + p.width) - base.left;  // Right edge of portfolio card
      const fromY = p.top + p.height / 2 - base.top;  // Center Y of portfolio card
      const toX = t.left - base.left;     // Left edge of trading card
      const toY = t.top + t.height / 2 - base.top;     // Center Y of trading card
      
      
      // Extend arrow length by moving start point further out and end point further in
      const offsetFromX = fromX + 15;  // Start further right from portfolio
      const offsetFromY = fromY;
      const offsetToX = toX - 15;      // End further left from trading card
      const offsetToY = toY;
      const midX = (offsetFromX + offsetToX) / 2;
      const d = `M ${offsetFromX} ${offsetFromY} C ${midX} ${offsetFromY}, ${midX} ${offsetToY}, ${offsetToX} ${offsetToY}`;
      setArrowD((prev) => (prev === d ? prev : d));


      // Thickness inversely proportional to length (longer when minimized => thinner)
      const len = Math.hypot(toX - fromX, toY - fromY);
      const norm = base.width ? Math.min(Math.max(len / base.width, 0), 1) : 0.3;
      const minT = 2;
      const maxT = 6;
      const tWidth = Math.round((maxT - (maxT - minT) * norm) * 10) / 10;
      setArrowThickness((prev) => (prev === tWidth ? prev : tWidth));
    };

    update();
    const RO: typeof ResizeObserver | undefined = (typeof window !== "undefined" && "ResizeObserver" in window) ? (window.ResizeObserver as typeof ResizeObserver) : undefined;
    let ro: ResizeObserver | undefined;
    if (RO) {
      ro = new RO(() => update());
      if (portfolioEdgeRef.current) ro.observe(portfolioEdgeRef.current);
      if (tradingEdgeRef.current) ro.observe(tradingEdgeRef.current);
      if (inlineFlowRef.current) ro.observe(inlineFlowRef.current);
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true } as AddEventListenerOptions);
    return () => {
      ro?.disconnect?.();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <section className="py-24 px-8 md:px-16 relative overflow-hidden w-full -mt-16" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)' }}>
      {/* Background image */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background">
        <img
          src={heroBg}
          alt="Financial data visualization"
          className="w-full h-full object-cover opacity-40 mix-blend-screen filter contrast-125 brightness-110 saturate-125"
          style={{ objectPosition: '50% 60%', filter: 'hue-rotate(40deg) saturate(1.05) brightness(0.85) contrast(1.1)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)' }}
        />
        <div className="absolute inset-0 bg-black/45 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      {/* Network graph background */}
      <NetworkGraph
        className="absolute inset-0 opacity-25 md:opacity-30 mix-blend-screen pointer-events-none"
        nodes={10}
        animated
        nodeColor="hsl(205 100% 88%)"
        lineColor="hsl(205 100% 85% / 0.6)"
        avoidRef={contentRef}
        avoidPadding={32}
      />
      <div ref={contentRef} className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16" ref={headerAnimation.ref} style={headerAnimation.style}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Multi-Agent AI Solution
          </h2>
          <p className="text-xl text-white max-w-3xl mx-auto">
            An autonomous AI trading analysis and asset management platform that automates the entire 
            investment workflow through a coordinated multi-agent system
          </p>
        </div>

        <div className="relative" ref={inlineFlowRef}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" viewBox="0 0 1087 468" preserveAspectRatio="none">
            <defs>
              <marker id="arrow" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="hsl(var(--accent))" />
              </marker>
              <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d="M 346.328125 70 C 358.328125 70, 358.328125 234, 370.328125 234" stroke="hsl(var(--accent))" strokeWidth="2" fill="none" markerEnd="url(#arrow)" filter="url(#glow-line)" opacity="0.9" />
            <path d="M 346.328125 234 C 358.328125 234, 358.328125 234, 370.328125 234" stroke="hsl(var(--accent))" strokeWidth="2" fill="none" markerEnd="url(#arrow)" filter="url(#glow-line)" opacity="0.9" />
            <path d="M 346.328125 398 C 358.328125 398, 358.328125 234, 370.328125 234" stroke="hsl(var(--accent))" strokeWidth="2" fill="none" markerEnd="url(#arrow)" filter="url(#glow-line)" opacity="0.9" />
          </svg>

          {/* Dynamic arrow between Portfolio and Trading */}
          <svg className="absolute inset-0 pointer-events-none z-50" width="100%" height="100%">
            <defs>
              <marker id="arrow-dyn" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="#FFD700" />
              </marker>
              <filter id="glow-line-dyn" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {arrowD && (
              <path d={arrowD} stroke="#FFD700" strokeWidth={3} fill="none" markerEnd="url(#arrow-dyn)" opacity="1" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>

          <div className="relative z-10 grid md:grid-cols-3 gap-y-6 gap-x-8 md:gap-x-16 items-stretch">
            <div className="flex flex-col gap-6">
              <div ref={techAnim.ref} style={techAnim.style}>
                <TechnicalAnalysisCard />
              </div>
              <div ref={fundAnim.ref} style={fundAnim.style} className="relative">
                <FundamentalAnalysisCard />
<div className="hidden md:block absolute top-1/2 left-full -translate-y-1/2 h-[3px] bg-accent/70 w-20 sm:w-24 md:w-32 lg:w-48 xl:w-64" aria-hidden />
              </div>
              <div ref={marketAnim.ref} style={marketAnim.style}>
                <MarketIntelligenceCard />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full" ref={portfolioEdgeRef}>
                <div className="relative" ref={portfolioAnim.ref} style={portfolioAnim.style}>
                  <PortfolioManagementCard />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full" ref={tradingEdgeRef}>
                <div ref={tradingAnim.ref} style={tradingAnim.style}>
                  <TradingAgentCard />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Solution;
