/**
 * OmniChat Web Notification & In-App Notification Manager
 */

import { playChatTone } from "@/lib/chat/sound";
import { triggerHaptic } from "./mobile/haptics";

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
  type?: "message" | "booking" | "lead" | "system";
}

type NotificationListener = (notification: InAppNotification) => void;
const listeners = new Set<NotificationListener>();

export function subscribeInAppNotifications(listener: NotificationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Dispatch notification to in-app banner, Web Audio sound and Web Push (if granted)
 */
export function sendOmniNotification(options: {
  title: string;
  body: string;
  url?: string;
  type?: "message" | "booking" | "lead" | "system";
  playSound?: boolean;
  haptic?: boolean;
}) {
  const notification: InAppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: options.title,
    body: options.body,
    url: options.url,
    timestamp: Date.now(),
    type: options.type || "message",
  };

  // 1. Play "Ting" sound
  if (options.playSound !== false) {
    try {
      playChatTone();
    } catch {
      // AudioContext might require user gesture
    }
  }

  // 2. Trigger Haptic
  if (options.haptic !== false) {
    triggerHaptic(options.type === "booking" ? "success" : "light");
  }

  // 3. Dispatch to in-app listeners (top banner / snackbar)
  listeners.forEach((listener) => {
    try {
      listener(notification);
    } catch {
      // Ignore listener error
    }
  });

  // 4. Trigger Web Notification API if permitted and document is hidden
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted" &&
    (document.hidden || options.type === "booking")
  ) {
    try {
      const nativeNotif = new Notification(options.title, {
        body: options.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      });
      nativeNotif.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
        nativeNotif.close();
      };
    } catch {
      // Fallback or iOS Safari limitation
    }
  }

  return notification;
}

/**
 * Request Web Notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}
