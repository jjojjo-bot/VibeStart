import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const GA_ID = "G-T3GQ0P5N6P";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://vibestart.dev";

export const metadata: Metadata = {
  title: {
    default: "VibeStart — 바이브코딩, 여기서 시작하세요",
    template: "%s — VibeStart",
  },
  description:
    "AI로 코딩하고 싶은데 환경 세팅이 어려우셨나요? VibeStart가 단계별로 안내해드립니다.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "VibeStart — 바이브코딩, 여기서 시작하세요",
    description:
      "개발 도구 설치가 어려워서 포기하셨나요? VibeStart가 하나하나 안내해드릴게요.",
    url: siteUrl,
    siteName: "VibeStart",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeStart — 바이브코딩, 여기서 시작하세요",
    description:
      "개발 도구 설치가 어려워서 포기하셨나요? VibeStart가 하나하나 안내해드릴게요.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
