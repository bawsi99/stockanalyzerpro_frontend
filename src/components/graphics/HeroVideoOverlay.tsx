import React, { useEffect, useRef, useState } from "react";

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
  const [isReady, setIsReady] = useState(false);
  const readyCountRef = useRef(0);

  useEffect(() => {
    const a = aRef.current!;
    const b = bRef.current!;
    let mounted = true;

    // Initialize videos with opacity 0 to prevent flash
    a.style.opacity = "0";
    b.style.opacity = "0";

    const checkReady = () => {
      readyCountRef.current++;
      // Wait for both videos to be ready
      if (readyCountRef.current >= 2 && mounted) {
        setIsReady(true);
        // Set initial opacity - video A should be fully visible initially
        a.style.opacity = "1";
        b.style.opacity = "0";
      }
    };

    const onCanPlayThrough = () => {
      if (!mounted) return;
      checkReady();
    };

    const onMeta = () => {
      if (!mounted) return;
      const d = a.duration || b.duration || 0;
      if (!d || !isFinite(d)) return;
      durationRef.current = d;
      try { 
        b.currentTime = (d / 2) % d; 
      } catch {}
    };

    // Use canplaythrough instead of canplay for smoother playback
    a.addEventListener("loadedmetadata", onMeta);
    b.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("canplaythrough", onCanPlayThrough);
    b.addEventListener("canplaythrough", onCanPlayThrough);

    // Start loading and playing videos
    const startPlayback = async () => {
      try {
        // Preload videos
        a.load();
        b.load();
        
        // Wait a bit for initial buffering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Start playing both videos
        await Promise.all([
          a.play().catch(() => {}),
          b.play().catch(() => {})
        ]);
      } catch (e) {
        // Silently handle errors
      }
    };

    startPlayback();

    const loop = () => {
      if (!mounted) return;
      
      const d = durationRef.current;
      // Only start crossfade animation when videos are ready
      if (d > 0 && isReady) {
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
    
    // Start the animation loop
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      a.removeEventListener("loadedmetadata", onMeta);
      b.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("canplaythrough", onCanPlayThrough);
      b.removeEventListener("canplaythrough", onCanPlayThrough);
    };
  }, [src, fadeWindowSec, isReady]);

  return (
    <div className={className} style={{ mixBlendMode: blend === "normal" ? undefined : blend }}>
      <video ref={aRef} className="absolute inset-0 w-full h-full object-cover" src={src} muted playsInline autoPlay loop preload="auto" />
      <video ref={bRef} className="absolute inset-0 w-full h-full object-cover" src={src} muted playsInline autoPlay loop preload="auto" />
    </div>
  );
};

export default HeroVideoOverlay;
