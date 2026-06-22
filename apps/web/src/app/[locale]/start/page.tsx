import type { Metadata } from 'next';
import Script from 'next/script';
import { BuildWizard } from '@/components/start/build-wizard';
import { pageAlternates } from '@/lib/canonical';

// /start 자체를 가리키는 canonical + hreflang. 루트 레이아웃의 canonical(로케일 루트)을
// 상속하면 홈을 가리켜 Lighthouse SEO에서 감점되므로 라우트 단위로 덮어쓴다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: pageAlternates(locale, 'start') };
}

export default function StartPage() {
  return (
    <main id="main-content" className="lg-scope app">
      <BuildWizard />
      {/* 글래스 강도 튜너: 개발 중에만 로드(우하단 🎛 / Ctrl+Shift+G). 배포 빌드엔 미포함. */}
      {process.env.NODE_ENV === 'development' && (
        <Script src="/glass-tuner.js" strategy="afterInteractive" />
      )}
    </main>
  );
}
