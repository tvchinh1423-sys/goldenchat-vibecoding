/**
 * Tiện ích nhận diện hệ điều hành và nền tảng thiết bị cross-platform:
 * iOS (iPhone, iPad), macOS, Windows, Android, Linux.
 */

export function isApplePlatform(): boolean {
  if (typeof window === "undefined") return true;
  const ua = window.navigator.userAgent.toLowerCase();
  const isTouchMac = typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /macintosh|mac os x|iphone|ipad|ipod/.test(ua) || isTouchMac;
}

export function isWindowsPlatform(): boolean {
  if (typeof window === "undefined") return false;
  return /windows|win32|win64/.test(window.navigator.userAgent.toLowerCase());
}

export function isAndroidPlatform(): boolean {
  if (typeof window === "undefined") return false;
  return /android/.test(window.navigator.userAgent.toLowerCase());
}

export function isMobileOrTabletDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isTouchMac = typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return (
    isTouchMac ||
    /android|iphone|ipad|ipod|mobile|tablet/.test(ua) ||
    (window.innerWidth <= 1024 && navigator.maxTouchPoints > 0)
  );
}

/**
 * Trả về nhãn phím tắt phù hợp với hệ điều hành:
 * - macOS / iOS: "⌘K"
 * - Windows / Android / Linux: "Ctrl K"
 */
export function getPlatformShortcutLabel(): string {
  return isApplePlatform() ? "⌘K" : "Ctrl K";
}
