// @vitest-environment node
/**
 * @vibestart/track-catalog 구조 회귀 방지.
 *
 * Phase 2a 정적 트랙의 불변 조건:
 *   - 4개 트랙 존재, 정적만 enabled
 *   - 정적 트랙에 정확히 5개 마일스톤이 M1→M2→M3→M4→M5 순서
 *   - unlocks 체인이 끊김 없이 이어짐 (마지막은 null)
 *   - substep titleKey의 "substeps" 세그먼트 뒤 부분에는 점(.) 없음
 *     → next-intl이 점을 네임스페이스 구분자로 해석하는 제약 회귀 방지
 *   - 모든 substep id가 카탈로그 내 유일함
 */

import { describe, expect, it } from "vitest";
import {
  createInMemoryMilestoneCatalog,
  staticMilestones,
} from "@vibestart/track-catalog";

const EXPECTED_STATIC_ORDER = [
  "m1-deploy",
  "m2-google-auth",
  "m3-analytics",
  "m4-sentry",
  "m5-domain",
] as const;

describe("track catalog — static track", () => {
  const catalog = createInMemoryMilestoneCatalog();

  it("exposes exactly 4 tracks with only static enabled", () => {
    const tracks = catalog.listTracks();
    expect(tracks).toHaveLength(4);

    const byId = new Map(tracks.map((t) => [t.id, t]));
    expect(byId.get("static")?.enabled).toBe(true);
    expect(byId.get("dynamic")?.enabled).toBe(false);
    expect(byId.get("ai")?.enabled).toBe(false);
    expect(byId.get("ecommerce")?.enabled).toBe(false);
  });

  it("static track has exactly 5 milestones in the expected order", () => {
    const milestones = catalog.listMilestones("static");
    expect(milestones).toHaveLength(5);
    expect(milestones.map((m) => m.id)).toEqual(EXPECTED_STATIC_ORDER);
  });

  it("order fields are 1..5 in sequence", () => {
    const orders = staticMilestones.map((m) => m.order);
    expect(orders).toEqual([1, 2, 3, 4, 5]);
  });

  it("unlocks chain is unbroken and terminates at m5", () => {
    const milestones = catalog.listMilestones("static");
    for (let i = 0; i < milestones.length - 1; i++) {
      const current = milestones[i]!;
      const next = milestones[i + 1]!;
      expect(current.unlocks, `${current.id}.unlocks`).toBe(next.id);
    }
    const last = milestones[milestones.length - 1]!;
    expect(last.unlocks).toBeNull();
  });

  it("every substep titleKey has no dot in the post-substeps segment", () => {
    // next-intl은 메시지 키에 "."을 네임스페이스 구분자로 쓴다. 오늘 발생한
    // substep id 점 사고(m1.s1.github-oauth → INVALID_KEY) 회귀 방지.
    for (const m of staticMilestones) {
      for (const s of m.substeps) {
        const after = s.titleKey.split(".substeps.")[1];
        expect(after, `${m.id}/${s.id} titleKey`).toBeDefined();
        expect(
          after!.includes("."),
          `${m.id}/${s.id} substep segment contains "."`,
        ).toBe(false);
      }
    }
  });

  it("every substep has no dot in its id", () => {
    for (const m of staticMilestones) {
      for (const s of m.substeps) {
        expect(s.id.includes("."), `${m.id}/${s.id} id contains "."`).toBe(
          false,
        );
      }
    }
  });

  it("substep ids are unique within each milestone", () => {
    for (const m of staticMilestones) {
      const ids = m.substeps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("getMilestone returns null for unknown id", () => {
    expect(catalog.getMilestone("static", "non-existent")).toBeNull();
  });

  it("listMilestones returns empty array for disabled tracks", () => {
    expect(catalog.listMilestones("dynamic")).toEqual([]);
    expect(catalog.listMilestones("ai")).toEqual([]);
    expect(catalog.listMilestones("ecommerce")).toEqual([]);
  });
});
