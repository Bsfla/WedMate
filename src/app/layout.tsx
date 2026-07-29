import type { Metadata, Viewport } from "next";
import "./globals.css";

// 폰트는 globals.css가 Pretendard variable dynamic-subset을 import 해 처리한다.
// next/font/google(Geist)은 제거했다 — 빌드마다 Google Fonts를 때리지 않게 되는 부수 효과가 있다.

export const metadata: Metadata = {
  title: {
    default: "웨딩 가계부",
    template: "%s · 웨딩 가계부",
  },
  description: "예비부부 둘이 함께 쓰는, 결혼 준비 예산 전용 모바일 가계부",
  applicationName: "웨딩 가계부",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "웨딩 가계부",
  },
  // 금액 숫자가 iOS에서 전화번호로 잡히는 것을 막는다.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 하단 탭이 홈 인디케이터에 가리지 않도록 safe-area를 노출시킨다.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e10" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
