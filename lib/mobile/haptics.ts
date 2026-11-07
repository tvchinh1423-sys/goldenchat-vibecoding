/**
 * Native Haptic Feedback Utilities for Mobile
 * Works on Android Chrome/Edge and compatible WebViews.
 * Gracefully degrades to no-op on iOS Safari / unsupported browsers.
 */

export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "warning" = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate(40);
        break;
      case "success":
        navigator.vibrate([15, 60, 25]);
        break;
      case "warning":
        navigator.vibrate([40, 80, 40]);
        break;
    }
  } catch {
    // Ignore any browser vibration permission restrictions
  }
}
