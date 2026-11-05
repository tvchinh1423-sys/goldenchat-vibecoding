import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hộp thư | OmniChat AI",
  description: "Không gian tư vấn đa kênh của Học viện Kstudy.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
