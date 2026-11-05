import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "OmniChat AI — Hệ thống Chatbot FAQ & Đặt Lịch Tư Vấn Đa Kênh",
  description: "Giải pháp Chatbot AI Đa kênh (Facebook & Zalo qua Botcake, Web) - VibeCoding 2026",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OmniChat AI",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased select-none-touch overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
