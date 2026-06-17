import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

// Google AdSense — 게시자 ID는 공개 값이므로 GA_ID처럼 상수로 관리한다.
const ADSENSE_CLIENT = "ca-pub-9388755711448095";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/*
          AdSense 스크립트. next/script(afterInteractive)는 클라이언트에서 주입돼
          서버 HTML에 <script> 태그가 안 남고, 그 결과 AdSense 검증 크롤러가
          소유권을 확인하지 못한다. React 19는 <script async>를 <head>로 hoisting
          하므로 raw 태그로 두면 서버 HTML head에 실제 <script>가 출력된다.
        */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
