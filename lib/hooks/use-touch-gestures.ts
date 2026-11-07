"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { triggerHaptic } from "@/lib/mobile/haptics";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number;
  maxDuration?: number;
  edgeOnly?: boolean; // For iOS back gesture: only trigger when swipe starts near edge (< 40px)
}

export function useSwipe<T extends HTMLElement = HTMLElement>(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 60, maxDuration = 400, edgeOnly = false } = options;
  const targetRef = useRef<T | null>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (edgeOnly && touch.clientX > 48) {
        touchStart.current = null;
        return;
      }
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const duration = Date.now() - touchStart.current.time;

      if (duration > maxDuration) {
        touchStart.current = null;
        return;
      }

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > threshold && absX > absY * 1.4) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          triggerHaptic("light");
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          triggerHaptic("light");
          handlers.onSwipeLeft();
        }
      } else if (absY > threshold && absY > absX * 1.4) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          triggerHaptic("light");
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          triggerHaptic("light");
          handlers.onSwipeUp();
        }
      }

      touchStart.current = null;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handlers, threshold, maxDuration, edgeOnly]);

  return targetRef;
}

export function usePullToRefresh<T extends HTMLElement = HTMLElement>(
  onRefresh: () => Promise<void> | void,
  pullThreshold: number = 70
) {
  const containerRef = useRef<T | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 5 || isRefreshing) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === null || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Damping resistance
      const distance = Math.min(diff * 0.45, 110);
      setPullDistance(distance);
      if (distance >= pullThreshold && !isPullingRef.current) {
        isPullingRef.current = true;
        triggerHaptic("light");
      }
    } else {
      setPullDistance(0);
      isPullingRef.current = false;
    }
  }, [isRefreshing, pullThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (isPullingRef.current && pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic("medium");
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    isPullingRef.current = false;
    startY.current = null;
  }, [isRefreshing, onRefresh, pullDistance, pullThreshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, pullDistance, isRefreshing };
}
