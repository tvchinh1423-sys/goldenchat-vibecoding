"use client";

import { useEffect, useRef } from "react";

/** Fit a full-screen chat to the visible area above the mobile keyboard. */
export function useVisualViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    const element = ref.current;
    if (!viewport || !element) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--chat-height", `${viewport.height}px`);
        element.style.setProperty("--chat-top", `${viewport.offsetTop}px`);
        element.toggleAttribute(
          "data-keyboard-open",
          viewport.scale === 1 && window.innerHeight - viewport.height > 100,
        );
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return ref;
}
