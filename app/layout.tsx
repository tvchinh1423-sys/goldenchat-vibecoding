import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniChat AI — Hệ thống Chatbot FAQ & Đặt Lịch Tư Vấn Đa Kênh",
  description: "Giải pháp Chatbot AI Đa kênh (Facebook & Zalo qua Botcake, Web) - VibeCoding 2026 Đề 04",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
