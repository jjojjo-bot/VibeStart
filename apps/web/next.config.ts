import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CSP는 Report-Only로만 시작한다. AdSense/GA가 인라인 스크립트를 주입해 엄격(nonce)
// CSP와 충돌하므로(라이브 광고·인증이 깨질 위험), 차단 없이 위반을 "관측만" 한다.
// 외부 출처는 AdSense·GA·Supabase·구글 폰트/ jsDelivr·Vercel을 허용목록에 둔다.
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google.com https://*.doubleclick.net https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://pagead2.googlesyndication.com https://*.google.com https://*.vercel-insights.com",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.doubleclick.net https://www.google.com https://*.googlesyndication.com",
].join("; ");

// 차단해도 앱이 깨지지 않는 안전한 보안 헤더만 enforce한다.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["recharts", "canvas-confetti", "@supabase/supabase-js"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
