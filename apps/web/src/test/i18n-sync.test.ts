// @vitest-environment node
/**
 * i18n 키 동기화 테스트.
 *
 * CLAUDE.md 규칙: 한국어(ko.json)가 원본이며 나머지 5개 locale은 동일한 키
 * 그래프를 가져야 한다. 이 테스트는 node 환경에서 JSON 파일을 직접 읽어
 * 키 집합을 비교한다.
 *
 * ROI 최상: 번역 누락으로 인한 production MISSING_MESSAGE 경고를 PR 시점에
 * 기계적으로 차단. 테스터 제안의 최우선 테스트.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const MESSAGES_DIR = path.resolve(__dirname, "../../messages");
const BASE = "ko";
const LOCALES = ["en", "ja", "zh", "es", "hi"] as const;

function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flatten(v as Record<string, unknown>, p));
    } else {
      keys.push(p);
    }
  }
  return keys.sort();
}

function loadLocale(locale: string): Set<string> {
  const raw = fs.readFileSync(
    path.join(MESSAGES_DIR, `${locale}.json`),
    "utf-8",
  );
  return new Set(flatten(JSON.parse(raw)));
}

describe("i18n message key sync", () => {
  const baseKeys = loadLocale(BASE);

  it(`${BASE}.json has a non-empty key graph`, () => {
    expect(baseKeys.size).toBeGreaterThan(0);
  });

  it.each(LOCALES)(
    "%s.json has exactly the same keys as ko.json",
    (locale) => {
      const otherKeys = loadLocale(locale);
      const missing = [...baseKeys].filter((k) => !otherKeys.has(k));
      const extra = [...otherKeys].filter((k) => !baseKeys.has(k));

      expect(missing, `missing keys in ${locale}`).toEqual([]);
      expect(extra, `extra keys in ${locale} not in ko`).toEqual([]);
      expect(otherKeys.size, `key count mismatch in ${locale}`).toBe(
        baseKeys.size,
      );
    },
  );

  it("no message key contains a dot character in its final segment", () => {
    // next-intl은 메시지 키에 "."을 네임스페이스 구분자로 해석한다. JSON 상의
    // 한 키 이름(마지막 세그먼트)이 점을 포함하면 런타임 INVALID_KEY 에러가
    // 난다. 오늘 발생한 substep id(m1.s1.github-oauth) 사고 회귀 방지.
    const raw = fs.readFileSync(
      path.join(MESSAGES_DIR, `${BASE}.json`),
      "utf-8",
    );
    const data = JSON.parse(raw);
    const invalidKeys: string[] = [];
    const walk = (obj: unknown, trail: string[]): void => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
      for (const k of Object.keys(obj as Record<string, unknown>)) {
        if (k.includes(".")) {
          invalidKeys.push([...trail, k].join(" > "));
        }
        walk((obj as Record<string, unknown>)[k], [...trail, k]);
      }
    };
    walk(data, []);
    expect(invalidKeys).toEqual([]);
  });
});
