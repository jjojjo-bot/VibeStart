// @vitest-environment node
/**
 * in-memory-store의 project_resources 슬롯 단위 테스트.
 *
 * - globalThis 캐시를 각 테스트 앞에서 비워서 격리
 * - addProjectResource 라운드트립
 * - 동일 (resourceType, externalId) 중복 추가 시 idempotent
 * - listProjectResources의 provider 필터
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  addProjectResource,
  getProjectResourceByType,
  listProjectResources,
} from "@/lib/projects/in-memory-store";

interface GlobalWithStore {
  __vibestartDummyStore?: unknown;
}

beforeEach(() => {
  delete (globalThis as GlobalWithStore).__vibestartDummyStore;
});

describe("in-memory-store project resources", () => {
  it("addProjectResource 후 getProjectResourceByType으로 조회된다", () => {
    const row = addProjectResource({
      projectId: "p1",
      provider: "github",
      resourceType: "github_repo",
      externalId: "octocat/my-blog",
      url: "https://github.com/octocat/my-blog",
      metadata: { defaultBranch: "main" },
    });

    expect(row.id).toMatch(/[0-9a-f-]{36}/);
    expect(row.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const fetched = getProjectResourceByType("p1", "github_repo");
    expect(fetched).not.toBeNull();
    expect(fetched?.externalId).toBe("octocat/my-blog");
    expect(fetched?.url).toBe("https://github.com/octocat/my-blog");
    expect(fetched?.metadata).toEqual({ defaultBranch: "main" });
  });

  it("동일 (resourceType, externalId)을 다시 추가하면 기존 row를 반환한다", () => {
    const first = addProjectResource({
      projectId: "p1",
      provider: "github",
      resourceType: "github_repo",
      externalId: "octocat/my-blog",
      url: null,
      metadata: {},
    });
    const second = addProjectResource({
      projectId: "p1",
      provider: "github",
      resourceType: "github_repo",
      externalId: "octocat/my-blog",
      url: "https://github.com/octocat/my-blog",
      metadata: { ignored: true },
    });

    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    // 두 번째 호출의 url/metadata는 무시되고 첫 row 그대로 반환된다
    expect(second.url).toBeNull();
    expect(second.metadata).toEqual({});

    expect(listProjectResources("p1")).toHaveLength(1);
  });

  it("listProjectResources는 provider 필터를 적용한다", () => {
    addProjectResource({
      projectId: "p1",
      provider: "github",
      resourceType: "github_repo",
      externalId: "x/a",
      url: null,
      metadata: {},
    });
    addProjectResource({
      projectId: "p1",
      provider: "vercel",
      resourceType: "vercel_project",
      externalId: "prj_123",
      url: null,
      metadata: {},
    });

    expect(listProjectResources("p1")).toHaveLength(2);
    expect(listProjectResources("p1", "github")).toHaveLength(1);
    expect(listProjectResources("p1", "vercel")).toHaveLength(1);
    expect(listProjectResources("p1", "sentry")).toHaveLength(0);
  });

  it("리소스가 없는 프로젝트는 null/빈 배열을 반환한다", () => {
    expect(getProjectResourceByType("none", "github_repo")).toBeNull();
    expect(listProjectResources("none")).toEqual([]);
  });
});
