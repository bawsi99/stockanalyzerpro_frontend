import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Clock, DollarSign, BarChart3, Shield, Activity, LineChart, Brain, TrendingUp as Indicator } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DecisionStory } from "@/types/analysis";

interface DecisionStoryCardProps {
  decisionStory: DecisionStory | null | undefined;
  analysisDate?: string;
  analysisPeriod?: string;
  fallbackFairValueRange?: number[] | null;
  agentRadiusOffsets?: Record<string, number>; // per-agent radius delta in px (positive = farther)
  agentTranslateOffsets?: Record<string, { dx?: number; dy?: number }>; // per-agent x/y pixel offsets
  invertOffsets?: boolean; // invert signs for all offsets
  globalRadiusDelta?: number; // adjusts overall radial distance (negative = closer)
  minRadiusOverride?: number; // overrides the minimum clamped radius
  onGlobalRadiusDeltaChange?: (n: number) => void; // optional controller from parent
  onMinRadiusOverrideChange?: (n: number) => void; // optional controller from parent
  onAgentTranslateChange?: (name: string, delta: { dx?: number; dy?: number }) => void; // per-agent XY tweak
  agentOrder?: string[]; // fixed ordering (patterns allowed)
  agentOrderPriority?: Record<string, number>; // alternative priority map
}

const DecisionStoryCard = ({ decisionStory, analysisDate, analysisPeriod, fallbackFairValueRange, agentRadiusOffsets, agentTranslateOffsets, invertOffsets, globalRadiusDelta, minRadiusOverride, onGlobalRadiusDeltaChange, onMinRadiusOverrideChange, onAgentTranslateChange, agentOrder, agentOrderPriority }: DecisionStoryCardProps) => {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [adjustOpen, setAdjustOpen] = useState<Set<string>>(new Set());
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const DEBUG_ALLOWED = String(import.meta.env.VITE_SHOW_DEBUG).toLowerCase() === 'true';
  const debugActive = DEBUG_ALLOWED && debugMode;
  const [showArrows, setShowArrows] = useState<boolean>(true);
  const [drawKey, setDrawKey] = useState<number>(0);
  const [lastExpandedAgent, setLastExpandedAgent] = useState<string | null>(null);
  // Suppress initial fly-in transitions on first mount (page load or tab mount)
  const [suppressInitialTransitions, setSuppressInitialTransitions] = useState<boolean>(true);
  // Enable fly-in only after the section has left the central band at least once
  const [allowFlyIn, setAllowFlyIn] = useState<boolean>(false);
  const hasLeftCentralBandRef = useRef<boolean>(false);

  useEffect(() => {
    // When arrows become visible, restart the draw animation
    if (showArrows) setDrawKey((k) => k + 1);
  }, [showArrows]);

  // Disable transitions for the very first paint, then re-enable
  useEffect(() => {
    const id = requestAnimationFrame(() => setSuppressInitialTransitions(false));
    return () => cancelAnimationFrame(id);
  }, []);

  // Hardcoded agent order
  const HARDCODED_ORDER = [
    'Technical Indicators',
    'Institutional Activity (volume based)',
    'Support Resistance (volume based)',
    'Volume Anomaly',
    'Volume Confirmation',
    'Volume Momentum',
    'Sector Analysis',
    'Multi-Timeframe Analysis',
    'Risk Analysis',
    'Cross-Validation Analysis',
    'Market Structure Analysis'
  ];
  const effectiveAgentOrder = agentOrder || HARDCODED_ORDER;

  // Resolve per-agent offsets with forgiving matching (exact, case-insensitive, substring)
  const resolveRadius = (name: string): number => {
    if (!agentRadiusOffsets) return 0;
    if (Object.prototype.hasOwnProperty.call(agentRadiusOffsets, name)) return agentRadiusOffsets[name] ?? 0;
    const lower = name.toLowerCase();
    const keys = Object.keys(agentRadiusOffsets);
    const key = keys.find(k => k.toLowerCase() === lower) ||
                keys.find(k => lower.includes(k.toLowerCase())) ||
                keys.find(k => k.toLowerCase().includes(lower));
    return key ? (agentRadiusOffsets[key] ?? 0) : 0;
  };
  const resolveTranslate = (name: string): { dx?: number; dy?: number } | undefined => {
    if (!agentTranslateOffsets) return undefined;
    if (Object.prototype.hasOwnProperty.call(agentTranslateOffsets, name)) return agentTranslateOffsets[name];
    const lower = name.toLowerCase();
    const keys = Object.keys(agentTranslateOffsets);
    const key = keys.find(k => k.toLowerCase() === lower) ||
                keys.find(k => lower.includes(k.toLowerCase())) ||
                keys.find(k => k.toLowerCase().includes(lower));
    return key ? agentTranslateOffsets[key] : undefined;
  };

  // Connector types and refs (must be declared before any early return)
  type Point = { x: number; y: number };
  const containerRef = useRef<HTMLDivElement | null>(null);
  const execRef = useRef<HTMLDivElement | null>(null);
  const agentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [edges, setEdges] = useState<Array<{ from: Point; to: Point; c1: Point; c2: Point; key: string; stroke?: string; width?: number; marker?: string }>>([]);
  const [agentPositions, setAgentPositions] = useState<Record<string, { left: number; top: number }>>({});
  const [agentOffsets, setAgentOffsets] = useState<Record<string, { ox: number; oy: number }>>({});
  const textRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
  const [overflowedAgents, setOverflowedAgents] = useState<Record<string, boolean>>({});
  const measurerRef = useRef<HTMLDivElement | null>(null);
  const [truncatedMap, setTruncatedMap] = useState<Record<string, string>>({});
  const agentSummariesRef = useRef<Record<string, string>>({});

  // Unified agent card dimensions (Executive Summary not affected)
  const AGENT_CARD_W = 240; // px
  const AGENT_CARD_H_DEFAULT = 130; // px (normal)
  const AGENT_CARD_H_DEBUG = 170; // px (debug)

  // Compute connectors from each agent card to Executive Summary
  useLayoutEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const exec = execRef.current;
      if (!container || !exec) return;
      const base = container.getBoundingClientRect();
      const execRect = exec.getBoundingClientRect();
      // Toggle arrow visibility based on Executive center within viewport central band
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const centerY = execRect.top + execRect.height / 2;
      // Further expanded central band to reduce unintended fly-outs on load/scroll
      const centralTop = vh * 0.05;
      const centralBottom = vh * 0.95;
      const inCentral = centerY >= centralTop && centerY <= centralBottom;
      setShowArrows(prev => (prev !== inCentral ? inCentral : prev));
      // Allow fly-in only after we have been outside the central band at least once
      if (!inCentral && !hasLeftCentralBandRef.current) {
        hasLeftCentralBandRef.current = true;
        setAllowFlyIn(true);
      }
      // Use container's center as the center of the radial pattern
      const execCenter: Point = {
        x: Math.round(base.width / 2),
        y: Math.round(base.height / 2),
      };

      // Compute radial positions based on data (not refs) so first paint works
      const baseNames = agent_summaries ? Object.keys(agent_summaries) : [];
      const norm = (s: string) => s.toLowerCase();
      const findIndexInOrder = (name: string): number => {
        const lname = norm(name);
        if (Array.isArray(effectiveAgentOrder) && effectiveAgentOrder.length) {
          for (let i = 0; i < effectiveAgentOrder.length; i++) {
            const pat = effectiveAgentOrder[i];
            const lp = norm(pat);
            if (lp === lname || lname.includes(lp) || lp.includes(lname)) return i;
          }
        }
        if (agentOrderPriority) {
          const keys = Object.keys(agentOrderPriority);
          for (const k of keys) {
            const lk = norm(k);
            if (lk === lname || lname.includes(lk) || lk.includes(lname)) return agentOrderPriority[k] as number;
          }
        }
        return Number.POSITIVE_INFINITY; // unknowns go last
      };
      const names = baseNames.sort((a, b) => {
        const ia = findIndexInOrder(a);
        const ib = findIndexInOrder(b);
        if (ia !== ib) return ia - ib;
        return a.localeCompare(b);
      });
      const N = names.length || 1;
      // Distribute cards evenly by present count, not by the full expected set
      const EXPECTED_FULL_COUNT = 11;
      // Scale designer offsets down when fewer than full set are present
      const offsetScale = N >= EXPECTED_FULL_COUNT ? 1 : Math.max(0, N / EXPECTED_FULL_COUNT);

      // Baseline is tuned for ~22" layout; only scale when viewport is smaller
      const BASE_W = 1400;
      const BASE_H = 900;
      const smallViewport = base.width < BASE_W || base.height < BASE_H;
      const viewportScaleRaw = Math.min(base.width / BASE_W, base.height / BASE_H);
      const viewportScale = Math.max(0.6, Math.min(1, viewportScaleRaw));
      const scale = smallViewport ? viewportScale : 1;

      const EXTRA_RADIUS = (140 + (globalRadiusDelta ?? 0)) * scale; // push cards farther/closer from center
      // Cap min radius only for small viewports
      const MIN_R_BASE = typeof minRadiusOverride === 'number' ? minRadiusOverride : 340;
      const MIN_R = smallViewport ? Math.min(MIN_R_BASE, Math.max(120, Math.min(base.width, base.height) / 2 - 60)) : MIN_R_BASE;
      const radius = Math.max(
        MIN_R,
        Math.min(base.width, base.height) / 2 - Math.max(execRect.width, execRect.height) / 2 - 10 + EXTRA_RADIUS
      );
      // Responsive card size for geometry calculations only on small viewports
      const CARD_W = smallViewport ? (base.width < 900 ? 200 : AGENT_CARD_W) : AGENT_CARD_W;
      const CARD_H = debugActive ? AGENT_CARD_H_DEBUG : (smallViewport ? (base.height < 800 ? 120 : AGENT_CARD_H_DEFAULT) : AGENT_CARD_H_DEFAULT);
      const newPositions: Record<string, { left: number; top: number }> = {};
      const newOffsets: Record<string, { ox: number; oy: number }> = {};
      const newEdges: Array<{ from: Point; to: Point; c1: Point; c2: Point; key: string; stroke?: string; width?: number; marker?: string }> = [];

      // Precompute per-index radial and XY offsets
      const sign = invertOffsets ? -1 : 1;
      const radials: number[] = names.map((n) => resolveRadius(n) * offsetScale * scale * sign);
      const translates: Array<{ dx: number; dy: number }> = names.map((n) => {
        const t = resolveTranslate(n);
        return {
          dx: ((t?.dx ?? 0) * sign) * offsetScale * scale,
          dy: ((t?.dy ?? 0) * sign) * offsetScale * scale,
        };
      });
      // For even N, enforce symmetry between opposite cards (i and i + N/2)
      if (N % 2 === 0) {
        const half = N / 2;
        for (let i = 0; i < half; i++) {
          const j = i + half;
          // Make radial deltas equal (average) for symmetry
          const avgR = (radials[i] + radials[j]) / 2;
          radials[i] = avgR;
          radials[j] = avgR;
          // Mirror XY translates for opposite card
          translates[j] = { dx: -translates[i].dx, dy: -translates[i].dy };
        }
      }

      names.forEach((name, i) => {
        // Equal angular spacing around the circle, start from top (-90deg)
        const angle = (i * (Math.PI * 2) / N) - Math.PI / 2;
        const r = radius + radials[i];
        let cx = execCenter.x + r * Math.cos(angle);
        let cy = execCenter.y + r * Math.sin(angle);
        const t = translates[i];
        cx += t.dx;
        cy += t.dy;
        // Clamp to container to avoid overflow (only on small viewports to preserve large-screen layout)
        if (smallViewport) {
          const M = 8;
          const halfW = CARD_W / 2;
          const halfH = CARD_H / 2;
          cx = Math.max(halfW + M, Math.min(base.width - halfW - M, cx));
          cy = Math.max(halfH + M, Math.min(base.height - halfH - M, cy));
        }
        newPositions[name] = { left: cx, top: cy };

        // Precompute outward fly-in offset along radial direction
        const vx = cx - execCenter.x;
        const vy = cy - execCenter.y;
        const len = Math.hypot(vx, vy) || 1;
        const ux = vx / len;
        const uy = vy / len;
        const dist = 120; // px to start from outside
        newOffsets[name] = { ox: Math.round(ux * dist), oy: Math.round(uy * dist) };

        // Start edge toward center using assumed card size
        const dx = execCenter.x - cx;
        const dy = execCenter.y - cy;
        let start: Point;
        if (Math.abs(dx) >= Math.abs(dy)) {
          start = { x: dx > 0 ? Math.round(cx + CARD_W / 2) : Math.round(cx - CARD_W / 2), y: Math.round(cy) };
        } else {
          start = { x: Math.round(cx), y: dy > 0 ? Math.round(cy + CARD_H / 2) : Math.round(cy - CARD_H / 2) };
        }

        // End all lines at exact center of Executive Summary
        const ex = execCenter.x, ey = execCenter.y;
        const to: Point = { x: ex, y: ey };

        // Curved inward path using cubic Bezier
        const c1: Point = { x: Math.round(start.x + (ex - start.x) * 0.5), y: Math.round(start.y + (ey - start.y) * 0.15) };
        const c2: Point = { x: Math.round(start.x + (ex - start.x) * 0.85), y: Math.round(start.y + (ey - start.y) * 0.6) };

        // Highlight specific arrows
        const lower = name.toLowerCase();
        const isVolumeAnomaly = name === 'Volume Anomaly' || (lower.includes('volume') && (lower.includes('anomaly') || lower.includes('anomoly')));
        const isRiskAnalysis = name === 'Risk Analysis' || lower.includes('risk analysis') || (lower.includes('risk') && lower.includes('analysis'));
        const isHighlighted = isVolumeAnomaly || isRiskAnalysis;
        const stroke = '#fde047'; // lighter yellow
        const width = 2.5; // uniform thickness
        const marker = undefined;

        newEdges.push({ from: start, to, c1, c2, key: name, stroke, width, marker });
      });

      // Add precise edges for specific cards using actual DOM rects (ensures visibility)
      const addPrecise = (label: string) => {
        // Find by exact key or relaxed match
        let el = agentRefs.current[label];
        if (!el) {
          const entries = Object.entries(agentRefs.current);
          const lower = label.toLowerCase();
          const match = entries.find(([k]) => k.toLowerCase() === lower) ||
                        entries.find(([k]) => k.toLowerCase().includes(lower));
          if (match) el = match[1];
        }
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = Math.round(r.left - base.left + r.width / 2);
        const cy = Math.round(r.top - base.top + r.height / 2);
        const dx = execCenter.x - cx;
        const dy = execCenter.y - cy;
        let start: Point;
        if (Math.abs(dx) >= Math.abs(dy)) {
          start = { x: dx > 0 ? Math.round(r.right - base.left) : Math.round(r.left - base.left), y: cy };
        } else {
          start = { x: cx, y: dy > 0 ? Math.round(r.bottom - base.top) : Math.round(r.top - base.top) };
        }
        const ex = execCenter.x, ey = execCenter.y;
        const to: Point = { x: ex, y: ey };
        const c1: Point = { x: Math.round(start.x + (ex - start.x) * 0.5), y: Math.round(start.y + (ey - start.y) * 0.15) };
        const c2: Point = { x: Math.round(start.x + (ex - start.x) * 0.85), y: Math.round(start.y + (ey - start.y) * 0.6) };
        newEdges.push({ from: start, to, c1, c2, key: label + '_precise', stroke: '#fde047', width: 2.5, marker: undefined });
      };
      addPrecise('Volume Anomaly');
      addPrecise('Risk Analysis');

      setAgentPositions(newPositions);
      setAgentOffsets(newOffsets);
      setEdges(newEdges);
    };

    update();
    const RO: typeof ResizeObserver | undefined = typeof window !== "undefined" ? (window as any).ResizeObserver : undefined;
    let ro: ResizeObserver | undefined;
    if (RO) {
      ro = new RO(() => update());
      if (containerRef.current) ro.observe(containerRef.current);
      if (execRef.current) ro.observe(execRef.current);
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [
    decisionStory?.agent_summaries,
    JSON.stringify(agentRadiusOffsets),
    JSON.stringify(agentTranslateOffsets),
    invertOffsets,
    globalRadiusDelta,
    minRadiusOverride,
    JSON.stringify(effectiveAgentOrder),
    JSON.stringify(agentOrderPriority || {}),
    debugActive,
    expandedAgents
  ]);

  // Measure overflow per card; avoid scroll-induced flicker by reacting only to resize/layout or expansion changes
  useLayoutEffect(() => {
    const clampPx = 80; // ~ max-h-20

    const measureAll = () => {
      const names = Object.keys(agentRefs.current);
      const nextOverflow: Record<string, boolean> = {};
      const nextTruncated: Record<string, string> = {};
      const FALLBACK_LIMIT = 120;

      const ensureTruncated = (name: string, full: string, p: HTMLParagraphElement) => {
        const meas = measurerRef.current;
        if (!meas) return;
        // Use collapsed card width (240px) for truncation, not current DOM width
        const COLLAPSED_CARD_WIDTH = 240;
        const width = COLLAPSED_CARD_WIDTH - 16; // subtract padding (px-2 = 16px)
        meas.style.width = width + 'px';
        // Target 5 lines of text with postfix
        meas.style.maxHeight = '105px';
        const postfix = ' … See more';
        
        // Split into words for word-level truncation
        const words = full.split(' ');
        let best = 0;
        
        for (let i = 0; i < words.length; i++) {
          const testText = words.slice(0, i + 1).join(' ');
          meas.textContent = testText + postfix;
          // Check if it fits in 5 lines (105px)
          if (meas.scrollHeight <= 105) {
            best = i + 1;
          } else {
            break;
          }
        }
        
        // Special case: Support Resistance needs 1 fewer word to fit 5 lines consistently
        const isSupportResistance = name.toLowerCase().includes('support') && name.toLowerCase().includes('resistance');
        if (isSupportResistance && best > 0) {
          best = Math.max(0, best - 1);
        }
        
        const trimmed = words.slice(0, best).join(' ').trim();
        nextTruncated[name] = trimmed;
      };

      names.forEach((name) => {
        const p = textRefs.current[name];
        if (!p) return;
        // Always use the original summary from ref, not the rendered text content (which changes when expanded)
        const full = agentSummariesRef.current[name];
        if (!full) return;
        const needsLong = full.length > FALLBACK_LIMIT;
        
        if (expandedAgents.has(name)) {
          nextOverflow[name] = false;
          // Clear truncation for expanded cards so old cached values don't persist
          nextTruncated[name] = '';
          return;
        }
        
        // Always recalculate truncation when collapsed to ensure fresh measurement at collapsed width
        if (needsLong && full) {
          ensureTruncated(name, full, p);
          nextOverflow[name] = true;
        } else {
          const isOverflow = p.scrollHeight > p.clientHeight + 1;
          nextOverflow[name] = isOverflow;
        }
      });

      // Commit only if changed to avoid rerenders/flicker
      setOverflowedAgents((prev) => {
        const same = Object.keys(nextOverflow).every((k) => prev[k] === nextOverflow[k]);
        return same ? prev : { ...prev, ...nextOverflow };
      });
      setTruncatedMap((prev) => {
        const same = Object.keys(nextTruncated).every((k) => prev[k] === nextTruncated[k]);
        return same ? prev : { ...prev, ...nextTruncated };
      });
    };

    // Use requestAnimationFrame to ensure DOM has updated before measuring
    const rafId = requestAnimationFrame(() => {
      measureAll();
    });

    // Observe layout/size changes, not scroll
    const RO: typeof ResizeObserver | undefined = typeof window !== 'undefined' ? (window as any).ResizeObserver : undefined;
    let ro: ResizeObserver | undefined;
    if (RO) {
      ro = new RO(() => measureAll());
      if (containerRef.current) ro.observe(containerRef.current);
      if (execRef.current) ro.observe(execRef.current);
    }
    const onResize = () => measureAll();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [expandedAgents]);

  const toggleAgentExpansion = (agentName: string) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentName)) {
        newSet.delete(agentName);
      } else {
        newSet.add(agentName);
        setLastExpandedAgent(agentName);
      }
      return newSet;
    });
  };

  const getAgentIcon = (agentName: string) => {
    const name = agentName.toLowerCase();
    if (name.includes('volume')) return <BarChart3 className="h-4 w-4" />;
    if (name.includes('risk')) return <Shield className="h-4 w-4" />;
    if (name.includes('sector')) return <Activity className="h-4 w-4" />;
    if (name.includes('pattern')) return <LineChart className="h-4 w-4" />;
    if (name.includes('multi') || name.includes('timeframe')) return <Clock className="h-4 w-4" />;
    if (name.includes('technical') || name.includes('indicator')) return <Indicator className="h-4 w-4" />;
    if (name.includes('final') || name.includes('decision')) return <Brain className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  const getAgentColor = (agentName: string) => {
    const name = agentName.toLowerCase();
    if (name.includes('volume')) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' };
    if (name.includes('risk')) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' };
    if (name.includes('sector')) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' };
    if (name.includes('pattern')) return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: 'text-purple-600' };
    if (name.includes('multi') || name.includes('timeframe')) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-600' };
    if (name.includes('technical') || name.includes('indicator')) return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', icon: 'text-teal-600' };
    if (name.includes('final') || name.includes('decision')) return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: 'text-indigo-600' };
    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-600' };
  };

  const isRiskAgent = (agentName: string) => {
    const lower = agentName.toLowerCase();
    return agentName === 'Risk Analysis' || lower.includes('risk analysis') || (lower.includes('risk') && lower.includes('analysis'));
  };

  // Expose helpers to console for exporting offsets
  useEffect(() => {
    const w: any = typeof window !== 'undefined' ? window : undefined;
    if (!w) return;
    w.getAgentOffsets = () => {
      const names = decisionStory?.agent_summaries ? Object.keys(decisionStory.agent_summaries) : [];
      const out: Record<string, { dx?: number; dy?: number }> = {};
      names.forEach((n) => {
        const t = resolveTranslate(n) || {};
        const dx = t.dx ?? 0;
        const dy = t.dy ?? 0;
        if (dx !== 0 || dy !== 0) out[n] = { dx, dy };
      });
      return out;
    };
    w.exportAgentOffsets = () => JSON.stringify(w.getAgentOffsets(), null, 2);
    return () => {
      // leave functions available; no cleanup to avoid breaking console refs during HMR
    };
  }, [decisionStory?.agent_summaries, JSON.stringify(agentTranslateOffsets)]);

  if (!decisionStory) {
    return (
      <div className="animated-border-glow relative bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 rounded-2xl p-6 backdrop-blur-sm z-10">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-purple-100/10 pointer-events-none z-10" />
        <div className="absolute inset-0 rounded-2xl bg-white pointer-events-none z-10" />
        <div className="relative z-20">
          <p className="text-base text-slate-700 leading-relaxed text-justify drop-shadow-sm">No decision story data available</p>
        </div>
      </div>
    );
  }

  const { narrative, decision_chain, agent_summaries } = decisionStory;

  const getConfidenceBadge = (confidence: number, level: string) => {
    const badgeColors = {
      high: "bg-green-100 text-green-800 border-green-200",
      moderate: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      low: "bg-red-100 text-red-800 border-red-200"
    };
    
    return (
      <Badge className={`${badgeColors[level as keyof typeof badgeColors] || badgeColors.moderate}`}>
        {confidence}% {level}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    const trendLower = trend.toLowerCase();
    if (trendLower.includes('bullish') || trendLower.includes('buy')) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trendLower.includes('bearish') || trendLower.includes('sell')) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Target className="h-4 w-4 text-slate-600" />;
  };

  const onDebug = () => {
    try {
      setDebugMode((prev) => !prev);
      const w: any = typeof window !== 'undefined' ? window : undefined;
      const exported = w?.getAgentOffsets ? w.exportAgentOffsets?.() : undefined;
      // eslint-disable-next-line no-console
      console.group('DecisionStory Debug');
      // eslint-disable-next-line no-console
      console.log({ globalRadiusDelta, minRadiusOverride });
      // eslint-disable-next-line no-console
      console.log('agentTranslateOffsets', agentTranslateOffsets);
      // eslint-disable-next-line no-console
      console.log('exportedOffsets', exported);
      // eslint-disable-next-line no-console
      console.log('agentPositions', agentPositions);
      // eslint-disable-next-line no-console
      console.log('edgesCount', edges.length);
      // eslint-disable-next-line no-console
      console.groupEnd();
    } catch {}
  };

  const borderRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, perimeter: 0 });
  const gradientId1 = useRef(`glowGradient-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    if (borderRef.current) {
      const updateDimensions = () => {
        const rect = borderRef.current?.getBoundingClientRect();
        if (rect) {
          const w = rect.width;
          const h = rect.height;
          const strokeWidth = 2;
          const r = 16; // border radius
          // Calculate perimeter for the rect accounting for inset positioning (2px = strokeWidth)
          const rectW = w - 2;
          const rectH = h - 2;
          const perimeter = 2 * (rectW - 2 * r) + 2 * (rectH - 2 * r) + 2 * Math.PI * r;
          setDimensions({ width: w, height: h, perimeter });
        }
      };
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  return (
    <div ref={borderRef} className="animated-border-glow relative bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 rounded-2xl p-6 backdrop-blur-sm transform hover:scale-[1.01] transition-all duration-300 z-10 border-2 border-[#FFD700]">
      
      {/* Glassmorphism overlay effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-purple-100/10 pointer-events-none z-10" />
      
      {/* Embossed border highlight */}
      <div className="absolute inset-0 rounded-2xl bg-white pointer-events-none z-10" />
      
      {/* Content */}
      <div className="relative z-20">
        <p className="text-base text-slate-700 leading-relaxed text-justify drop-shadow-sm whitespace-pre-wrap">
          {narrative}
        </p>
      </div>
    </div>
  );
};

export default DecisionStoryCard;