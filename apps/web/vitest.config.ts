import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest 설정.
 *
 * - 기본 환경은 jsdom — 컴포넌트 렌더 테스트 지원.
 * - 순수 node 테스트(i18n 파일 검증, track-catalog 구조)는 파일 상단에
 *   `// @vitest-environment node` pragma로 개별 지정.
 * - globals=false — describe/it/expect는 명시적 import. tsconfig와 충돌 없음.
 * - setup 파일에서 @testing-library/jest-dom/vitest를 import해 matcher 주입.
 * - @/* 경로 alias는 tsconfig.json의 paths와 동일.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    // Next.js 16 + React 19 + next-intl을 jsdom에서 돌릴 때 CSS import는 무시
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
