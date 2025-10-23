import { useEffect, useRef, useState } from 'react';

interface AnimationState {
  scale: number;
  opacity: number;
  brightness: number;
}

interface UseElementAnimationOptions {
  minY?: number; // viewport percentage (0-100) for top boundary
  maxY?: number; // viewport percentage (0-100) for bottom boundary
  maxScale?: number;
  minScale?: number;
  maxOpacity?: number;
  minOpacity?: number;
  maxBrightness?: number;
  minBrightness?: number;
}

export const useElementAnimation = (options: UseElementAnimationOptions = {}) => {
  const {
    minY = 20, // 20vh from top
    maxY = 80, // 80vh from top  
    maxScale = 1.1,
    minScale = 0.85,
    maxOpacity = 1.0,
    minOpacity = 0.6,
    maxBrightness = 1.2,
    minBrightness = 0.7,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [style, setStyle] = useState<AnimationState>({
    scale: minScale,
    opacity: minOpacity,
    brightness: minBrightness,
  });

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const viewportHeight = window.innerHeight;
      
      // Convert percentages to pixel coordinates
      const minYPixel = (minY / 100) * viewportHeight;
      const maxYPixel = (maxY / 100) * viewportHeight;
      
      // Check if element center is within the viewport boundaries
      if (elementCenter >= minYPixel && elementCenter <= maxYPixel) {
        // Element is within bounds - maximize
        setStyle({
          scale: maxScale,
          opacity: maxOpacity,
          brightness: maxBrightness,
        });
      } else {
        // Element is outside bounds - minimize
        // Calculate distance-based easing for smooth transitions
        const distanceFromBounds = Math.min(
          Math.abs(elementCenter - minYPixel),
          Math.abs(elementCenter - maxYPixel)
        );
        const maxDistance = viewportHeight * 0.3; // 30vh fade distance
        const ratio = Math.min(distanceFromBounds / maxDistance, 1);
        
        const scale = maxScale - (ratio * (maxScale - minScale));
        const opacity = maxOpacity - (ratio * (maxOpacity - minOpacity));
        const brightness = maxBrightness - (ratio * (maxBrightness - minBrightness));
        
        setStyle({
          scale: Math.max(scale, minScale),
          opacity: Math.max(opacity, minOpacity),
          brightness: Math.max(brightness, minBrightness),
        });
      }
      
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, [minY, maxY, maxScale, minScale, maxOpacity, minOpacity, maxBrightness, minBrightness]);

  return {
    ref: elementRef,
    style: {
      transform: `scale(${style.scale})`,
      opacity: style.opacity,
      filter: `brightness(${style.brightness})`,
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'transform, opacity, filter',
    },
  };
};