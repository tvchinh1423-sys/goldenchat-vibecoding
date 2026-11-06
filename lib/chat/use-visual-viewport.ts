"use client";

import { useEffect, useState } from "react";

/** Fit a full-screen chat to the visible area above the mobile keyboard. */
export function useVisualViewport<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || !element) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (viewport.scale !== 1) {
          element.style.removeProperty("--chat-height");
          element.style.removeProperty("--chat-top");
          element.removeAttribute("data-keyboard-open");
          return;
        }
        element.style.setProperty("--chat-height", `${viewport.height}px`);
        element.style.setProperty("--chat-top", `${viewport.offsetTop}px`);
        element.toggleAttribute(
          "data-keyboard-open",
          window.innerHeight - viewport.height > 100,
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
  }, [element]);

  return setElement;
}
