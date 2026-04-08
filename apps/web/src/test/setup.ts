/**
 * Vitest 공용 setup.
 *
 * 모든 테스트 파일 실행 전에 한 번 로드된다.
 * - @testing-library/jest-dom 매처(toBeInTheDocument 등)를 vitest expect에 주입
 * - "server-only" 모듈은 Next.js가 서버 전용 경계에 두는 sentinel인데,
 *   테스트 환경에서는 빈 모듈로 대체해 import 에러를 피한다.
 */

import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));
