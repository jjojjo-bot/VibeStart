// @vitest-environment node
/**
 * B′ 퍼블리시 — 순수 로직 안전장치.
 * 슬러그 규칙(예약어·형식)과 값 정제(허용 칸·문자열·길이)를 기계적으로 보장한다.
 * 공개 엔드포인트가 신뢰 불가한 입력을 받으므로 이게 통과해야 안전하다.
 */
import { describe, expect, it } from "vitest";
import { sanitizeTemplateValues, MAX_FIELD_LEN, getTemplate } from "@vibestart/template-catalog";
import { validateSlug, normalizeSlug, isReservedSlug } from "../lib/publish/slug";

describe("validateSlug", () => {
  it("정상 슬러그 통과", () => {
    expect(validateSlug("jiyeong")).toEqual({ ok: true });
    expect(validateSlug("my-cafe-2026")).toEqual({ ok: true });
  });

  it("너무 짧음/김 거부", () => {
    expect(validateSlug("ab")).toEqual({ ok: false, reason: "too-short" });
    expect(validateSlug("a".repeat(33))).toEqual({ ok: false, reason: "too-long" });
  });

  it("형식 위반 거부(대문자·공백·양끝 하이픈·기타문자)", () => {
    expect(validateSlug("Jiyeong").ok).toBe(false);
    expect(validateSlug("my cafe").ok).toBe(false);
    expect(validateSlug("-cafe").ok).toBe(false);
    expect(validateSlug("cafe-").ok).toBe(false);
    expect(validateSlug("café!").ok).toBe(false);
  });

  it("예약어 거부(라우트·브랜드 사칭 방지)", () => {
    // 3자 이상 예약어는 "reserved"로 거부.
    for (const s of ["api", "login", "dashboard", "vibestart", "admin"]) {
      expect(validateSlug(s)).toEqual({ ok: false, reason: "reserved" });
    }
    // 짧은 예약어("p")는 길이 검사에 먼저 걸리지만 예약 목록엔 있다.
    expect(isReservedSlug("p")).toBe(true);
    expect(validateSlug("p")).toEqual({ ok: false, reason: "too-short" });
  });
});

describe("normalizeSlug", () => {
  it("공백·대문자·특수문자를 하이픈 슬러그로", () => {
    expect(normalizeSlug("지영의 카페")).toBe(""); // 한글은 제거 → 빈 슬러그(사용자가 직접 입력 유도)
    expect(normalizeSlug("My Cafe 2026!")).toBe("my-cafe-2026");
    expect(normalizeSlug("--Hello--World--")).toBe("hello-world");
  });

  it("길이 상한과 끝 하이픈 정리", () => {
    const out = normalizeSlug("a".repeat(40));
    expect(out.length).toBeLessThanOrEqual(32);
    expect(out.endsWith("-")).toBe(false);
  });
});

describe("sanitizeTemplateValues", () => {
  const intro = getTemplate("intro")!; // title, tagline, body, contact

  it("허용 칸만 통과, 그 밖은 버린다", () => {
    expect(sanitizeTemplateValues(intro, { title: "김민지", evil: "<x>", id: 1 })).toEqual({
      title: "김민지",
    });
  });

  it("비문자열 칸은 버린다", () => {
    expect(sanitizeTemplateValues(intro, { title: 123, body: "안녕" })).toEqual({ body: "안녕" });
  });

  it("객체 아님·통과 칸 없음 → null", () => {
    expect(sanitizeTemplateValues(intro, null)).toBeNull();
    expect(sanitizeTemplateValues(intro, "x")).toBeNull();
    expect(sanitizeTemplateValues(intro, { nope: "x" })).toBeNull();
  });

  it("칸당 길이를 상한으로 자른다", () => {
    const out = sanitizeTemplateValues(intro, { body: "a".repeat(MAX_FIELD_LEN + 50) });
    expect(out?.body?.length).toBe(MAX_FIELD_LEN);
  });
});
