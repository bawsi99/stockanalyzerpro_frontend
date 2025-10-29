import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, TrendingUp, TrendingDown, AlertTriangle, Target, Clock, DollarSign, BarChart3, Shield, Activity, LineChart, Brain, TrendingUp as Indicator } from "lucide-react";
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
      const execCenter: Point = {
        x: Math.round(execRect.left - base.left + execRect.width / 2),
        y: Math.round(execRect.top - base.top + execRect.height / 2),
      };

      // Compute radial positions based on data (not refs) so first paint works
      const baseNames = agent_summaries ? Object.keys(agent_summaries) : [];
      const norm = (s: string) => s.toLowerCase();
      const findIndexInOrder = (name: string): number => {
        const lname = norm(name);
        if (Array.isArray(agentOrder) && agentOrder.length) {
          for (let i = 0; i < agentOrder.length; i++) {
            const pat = agentOrder[i];
            const lp = norm(pat);
            if (lp === lname || lname.includes(lp) || lp.includes(lname)) return i;
          }
        }
        if (agentOrderPriority) {
          const keys = Object.keys(agentOrderPriority);
          for (let k of keys) {
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
      const EXTRA_RADIUS = 140 + (globalRadiusDelta ?? 0); // push cards farther/closer from center
      const MIN_R = typeof minRadiusOverride === 'number' ? minRadiusOverride : 260;
      const radius = Math.max(
        MIN_R,
        Math.min(base.width, base.height) / 2 - Math.max(execRect.width, execRect.height) / 2 - 10 + EXTRA_RADIUS
      );
      const CARD_W = AGENT_CARD_W;
      const CARD_H = debugMode ? AGENT_CARD_H_DEBUG : AGENT_CARD_H_DEFAULT;
      const newPositions: Record<string, { left: number; top: number }> = {};
      const newEdges: Array<{ from: Point; to: Point; c1: Point; c2: Point; key: string; stroke?: string; width?: number; marker?: string }> = [];

      names.forEach((name, i) => {
        const angle = (i / N) * Math.PI * 2 - Math.PI / 2; // start at top
        const r = radius + ((invertOffsets ? -1 : 1) * resolveRadius(name));
        let cx = execCenter.x + r * Math.cos(angle);
        let cy = execCenter.y + r * Math.sin(angle);
        const t = resolveTranslate(name);
        if (t) {
          const m = invertOffsets ? -1 : 1;
          cx += (t.dx ?? 0) * m;
          cy += (t.dy ?? 0) * m;
        }
        newPositions[name] = { left: cx, top: cy };

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
    JSON.stringify(agentOrder || []),
    JSON.stringify(agentOrderPriority || {}),
    debugMode,
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
        const width = p.clientWidth || 200;
        meas.style.width = width + 'px';
        meas.style.maxHeight = clampPx + 'px';
        const postfix = ' … See more';
        let lo = 0, hi = full.length, best = 0;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          meas.textContent = full.slice(0, mid) + postfix;
          if (meas.scrollHeight <= clampPx) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        const trimmed = full.slice(0, Math.max(0, best)).replace(/\s+$/, '');
        nextTruncated[name] = trimmed;
      };

      names.forEach((name) => {
        const p = textRefs.current[name];
        if (!p) return;
        if (expandedAgents.has(name)) {
          nextOverflow[name] = false;
          return;
        }
        const isOverflow = p.scrollHeight > p.clientHeight + 1;
        const full = agentSummariesRef.current[name] || (p.textContent || '');
        const needsLong = full.length > FALLBACK_LIMIT;
        nextOverflow[name] = isOverflow || needsLong;
        if ((isOverflow || needsLong) && full) ensureTruncated(name, full, p);
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

    measureAll();

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
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <BookOpen className="h-4 w-4 mr-2 text-purple-500" />
            Decision Story
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {/* Analysis Date and Period */}
          <p className="text-slate-500">No decision story data available</p>
        </CardContent>
      </Card>
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

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <BookOpen className="h-4 w-4 mr-2 text-purple-500" />
            Decision Story
          </CardTitle>
          <button
            className="ml-3 text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={onDebug}
          >
            Debug
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6">
        {/* Analysis Date and Period */}

        {/* Radial layout container */}
        <div ref={containerRef} className="relative h-[1400px] md:h-[1600px] bg-black rounded-xl">
          {/* Connectors */}
          <svg className="absolute inset-0 pointer-events-none z-10" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            {edges.map(e => (
              <path
                key={e.key}
                d={`M ${e.from.x},${e.from.y} C ${e.c1.x},${e.c1.y} ${e.c2.x},${e.c2.y} ${e.to.x},${e.to.y}`}
                fill="none"
                stroke={e.stroke || '#fde047'}
                strokeWidth={2.5}
                opacity="0.9"
              />
            ))}
          </svg>

          {/* Executive Summary centered */}
          <div ref={execRef} className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-100 z-30 shadow-sm ${debugMode ? 'w-[800px] md:w-[1000px]' : 'w-[700px] md:w-[900px]'} h-auto overflow-hidden`}>
            <h3 className="font-semibold text-slate-800 mb-1 flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-purple-600" />
              Executive Summary
            </h3>
            <p className={`text-sm text-slate-700 leading-relaxed text-justify`}>
              {narrative}
            </p>
            {(debugMode && typeof globalRadiusDelta === 'number' && typeof minRadiusOverride === 'number') && (
              <div className="mt-2 border-t border-purple-100 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">Ring radius</span>
                    <input
                      type="range"
                      min={-400}
                      max={400}
                      step={10}
                      value={globalRadiusDelta}
                      onChange={(e) => onGlobalRadiusDeltaChange?.(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={globalRadiusDelta}
                      onChange={(e) => onGlobalRadiusDeltaChange?.(Number(e.target.value))}
                      className="w-16 border rounded px-1 py-0.5 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">Min radius</span>
                    <input
                      type="range"
                      min={80}
                      max={500}
                      step={10}
                      value={minRadiusOverride}
                      onChange={(e) => onMinRadiusOverrideChange?.(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={minRadiusOverride}
                      onChange={(e) => onMinRadiusOverrideChange?.(Number(e.target.value))}
                      className="w-16 border rounded px-1 py-0.5 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Radial agent ring */}
          {agent_summaries && Object.keys(agent_summaries).length > 0 && (
            <div className="pointer-events-none">
              {Object.entries(agent_summaries).map(([agentName, summary], i) => {
                const colors = getAgentColor(agentName);
                const isExpanded = expandedAgents.has(agentName);
                const pos = agentPositions[agentName];
                const fallbackLimit = 120;
                const needsFallback = summary.length > fallbackLimit;
                const showToggle = (!isExpanded) && ((overflowedAgents[agentName] || false) || needsFallback);

                if (!agentRefs.current[agentName]) agentRefs.current[agentName] = null;
                if (!textRefs.current[agentName]) textRefs.current[agentName] = null;
                agentSummariesRef.current[agentName] = summary;

                return (
                  <div
                    key={agentName}
                    ref={(el) => (agentRefs.current[agentName] = el)}
                    style={pos ? { position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)' } as React.CSSProperties : undefined}
className={`pointer-events-auto ${colors.bg} ${colors.border} border rounded-lg transition-all duration-200 hover:shadow-sm z-20 ${isExpanded && isRiskAgent(agentName) ? 'w-[360px] md:w-[420px] lg:w-[480px]' : 'w-[240px]'} ${isExpanded ? 'h-auto' : (debugMode ? 'h-[170px]' : 'h-auto')} px-2 py-1.5 overflow-hidden relative`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${colors.text} flex items-center text-sm`}>
                        <span className={colors.icon}>{getAgentIcon(agentName)}</span>
                        <span className="ml-2">{agentName}</span>
                      </h4>
                      {debugMode && (
                        <button
                          className="text-[10px] text-slate-600 hover:text-slate-800 underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdjustOpen(prev => {
                              const ns = new Set(prev);
                              if (ns.has(agentName)) {
                                ns.delete(agentName);
                              } else {
                                ns.add(agentName);
                              }
                              return ns;
                            });
                          }}
                        >
                          Adjust
                        </button>
                      )}
                    </div>
                    <div className="mt-0.5 pr-0">
                      <p
                        ref={(el) => (textRefs.current[agentName] = el)}
                        className={`text-xs text-justify ${colors.text.replace('-800', '-700')} leading-relaxed whitespace-normal break-words ${isExpanded ? 'max-h-none overflow-visible' : 'max-h-20 overflow-hidden'}`}
                      >
                        {isExpanded ? (
                          <>
                            {summary}{' '}
                            <button
                              className="inline text-blue-600 hover:text-blue-700 text-xs underline"
                              onClick={(e) => { e.stopPropagation(); toggleAgentExpansion(agentName); }}
                            >
                              See less
                            </button>
                          </>
                        ) : (
                          <>
                            {(overflowedAgents[agentName] && truncatedMap[agentName])
                              ? truncatedMap[agentName]
                              : (needsFallback ? summary.slice(0, fallbackLimit).replace(/\s+$/,'') : summary)}
                            {showToggle && (
                              <>
                                {' '}
                                …{' '}
                                <button
                                  className="inline text-blue-600 hover:text-blue-700 text-xs underline"
                                  onClick={(e) => { e.stopPropagation(); toggleAgentExpansion(agentName); }}
                                >
                                  See more
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </p>

                      {(debugMode && (adjustOpen.has(agentName) || true)) && (
                        <div className="mt-1 space-y-1">
                          {(() => {
                            const current = resolveTranslate(agentName) || {};
                            const dx = current.dx ?? 0;
                            const dy = current.dy ?? 0;
                            return (
                              <>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="w-14 text-right">X offset</span>
                                  <input
                                    type="range"
                                    min={-400}
                                    max={400}
                                    step={5}
                                    value={dx}
                                    onChange={(e) => { e.stopPropagation(); onAgentTranslateChange?.(agentName, { dx: Number(e.target.value) }); }}
                                    className="flex-1"
                                  />
                                  <input
                                    type="number"
                                    value={dx}
                                    onChange={(e) => { e.stopPropagation(); onAgentTranslateChange?.(agentName, { dx: Number(e.target.value) }); }}
                                    className="w-14 border rounded px-1 py-0.5 bg-white"
                                  />
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="w-14 text-right">Y offset</span>
                                  <input
                                    type="range"
                                    min={-400}
                                    max={400}
                                    step={5}
                                    value={dy}
                                    onChange={(e) => { e.stopPropagation(); onAgentTranslateChange?.(agentName, { dy: Number(e.target.value) }); }}
                                    className="flex-1"
                                  />
                                  <input
                                    type="number"
                                    value={dy}
                                    onChange={(e) => { e.stopPropagation(); onAgentTranslateChange?.(agentName, { dy: Number(e.target.value) }); }}
                                    className="w-14 border rounded px-1 py-0.5 bg-white"
                                  />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hidden measurer for truncation */}
        <div
          ref={measurerRef}
          className="fixed -left-[9999px] -top-[9999px] text-xs leading-relaxed whitespace-normal break-words"
          style={{ visibility: 'hidden', pointerEvents: 'none' }}
        />

        {/* Overall Assessment */}
        {decision_chain.overall_assessment && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
              {getTrendIcon(decision_chain.overall_assessment.trend)}
              <span className="ml-2">Overall Assessment</span>
            </h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 capitalize">
                    {decision_chain.overall_assessment.trend}
                  </div>
                  <div className="text-xs text-slate-600">Trend</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {getConfidenceBadge(
                      decision_chain.overall_assessment.confidence,
                      decision_chain.overall_assessment.confidence_level
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 capitalize">
                    {decision_chain.overall_assessment.confidence_level}
                  </div>
                  <div className="text-xs text-slate-600">Risk Level</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe Analysis */}
        {decision_chain.timeframe_analysis && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              Timeframe Analysis
            </h3>
            <div className="space-y-4">
              {/* Short Term */}
              {decision_chain.timeframe_analysis.short_term && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800">Short Term</h4>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      {decision_chain.timeframe_analysis.short_term.horizon} days
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    {decision_chain.timeframe_analysis.short_term.rationale}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-green-800">Entry Range:</span>
                      <div className="text-green-700">
                        {decision_chain.timeframe_analysis.short_term.entry_range?.length > 0 
                          ? `₹${decision_chain.timeframe_analysis.short_term.entry_range[0]?.toFixed(2) || 'N/A'} - ₹${decision_chain.timeframe_analysis.short_term.entry_range[1]?.toFixed(2) || 'N/A'}`
                          : 'Not specified'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Targets:</span>
                      <div className="text-green-700">
                        {decision_chain.timeframe_analysis.short_term.targets?.length > 0
                          ? decision_chain.timeframe_analysis.short_term.targets.map(t => `₹${t?.toFixed(2)}`).join(', ')
                          : 'Not specified'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Medium Term */}
              {decision_chain.timeframe_analysis.medium_term && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-yellow-800">Medium Term</h4>
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      {decision_chain.timeframe_analysis.medium_term.horizon} days
                    </Badge>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    {decision_chain.timeframe_analysis.medium_term.rationale}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-yellow-800">Entry Range:</span>
                      <div className="text-yellow-700">
                        {decision_chain.timeframe_analysis.medium_term.entry_range?.length > 0
                          ? `₹${decision_chain.timeframe_analysis.medium_term.entry_range[0]?.toFixed(2) || 'N/A'} - ₹${decision_chain.timeframe_analysis.medium_term.entry_range[1]?.toFixed(2) || 'N/A'}`
                          : 'Not specified'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-800">Targets:</span>
                      <div className="text-yellow-700">
                        {decision_chain.timeframe_analysis.medium_term.targets?.length > 0
                          ? decision_chain.timeframe_analysis.medium_term.targets.map(t => `₹${t?.toFixed(2)}`).join(', ')
                          : 'Not specified'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

{/* Long Term */}
              {decision_chain.timeframe_analysis.long_term && (() => {
                const rawFv = decision_chain.timeframe_analysis.long_term.fair_value_range;
                const isValidNum = (n: any) => typeof n === 'number' && isFinite(n);
                const fvPrimary = Array.isArray(rawFv) && rawFv.length >= 2 && isValidNum(rawFv[0]) && isValidNum(rawFv[1])
                  ? rawFv
                  : null;
                const fvFallback = Array.isArray(fallbackFairValueRange) && fallbackFairValueRange.length >= 2 &&
                                   isValidNum(fallbackFairValueRange[0]) && isValidNum(fallbackFairValueRange[1])
                  ? fallbackFairValueRange
                  : null;
                const fvToShow = fvPrimary || fvFallback;
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-800">Long Term</h4>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        {decision_chain.timeframe_analysis.long_term.horizon} days
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      {decision_chain.timeframe_analysis.long_term.rationale}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-blue-800">Rating:</span>
                        <div className="text-blue-700 capitalize">
                          {decision_chain.timeframe_analysis.long_term.technical_rating || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Fair Value:</span>
                        <div className="text-blue-700">
                          {fvToShow
                            ? `₹${(fvToShow[0] as number).toFixed(2)} - ₹${(fvToShow[1] as number).toFixed(2)}`
                            : 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {decision_chain.risk_assessment && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Risk Assessment
            </h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Risks */}
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">Primary Risks</h4>
                  <div className="space-y-1">
                    {decision_chain.risk_assessment.primary_risks?.length > 0 ? (
                      decision_chain.risk_assessment.primary_risks.slice(0, 3).map((risk, idx) => (
                        <div key={idx} className="text-sm text-orange-700 flex items-start">
                          <span className="inline-block w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {risk}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-orange-600">No specific risks identified</div>
                    )}
                  </div>
                </div>

                {/* Critical Levels */}
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">Critical Levels</h4>
                  <div className="space-y-1">
                    {decision_chain.risk_assessment.critical_levels?.length > 0 ? (
                      decision_chain.risk_assessment.critical_levels.slice(0, 3).map((level, idx) => (
                        <div key={idx} className="text-sm text-orange-700 flex items-center">
                          <Target className="h-3 w-3 mr-2 text-orange-600" />
                          ₹{typeof level === 'string' ? level : level.toFixed(2)}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-orange-600">No critical levels specified</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span>AI-Generated Analysis</span>
            <span>Updated: {analysisDate ? new Date(analysisDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DecisionStoryCard;