import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { AuthProvider } from "@/lib/auth/auth-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "OmniChat AI — Quản Trị Khách Hàng & Bot Đa Kênh",
  description: "Hệ thống Chatbot FAQ & Đặt Lịch Tư Vấn Đa Kênh (Facebook, Zalo, Web) — Golden Palace",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OmniChat AI",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased overflow-x-clip selection:bg-blue-100 selection:text-blue-900">
        <PWAProvider>
          <AuthProvider>{children}</AuthProvider>
        </PWAProvider>
      </body>
    </html>
  );
}

