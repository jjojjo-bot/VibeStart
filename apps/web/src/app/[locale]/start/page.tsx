import Script from 'next/script';
import { BuildWizard } from '@/components/start/build-wizard';

export default function StartPage() {
  return (
    <main id="main-content" className="app">
      <BuildWizard />
      {/* 글래스 강도 튜너: 개발 중에만 로드(우하단 🎛 / Ctrl+Shift+G). 배포 빌드엔 미포함. */}
      {process.env.NODE_ENV === 'development' && (
        <Script src="/glass-tuner.js" strategy="afterInteractive" />
      )}
    </main>
  );
}
