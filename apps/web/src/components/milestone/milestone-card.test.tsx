/**
 * MilestoneCard 렌더 스모크 테스트.
 *
 * 상태별(locked/in_progress/completed) UI 계약:
 *   - locked 카드는 Link로 감싸지지 않음 + lockedHint 표시
 *   - 활성 카드는 Link로 감싸짐 (href 확인) + lockedHint 숨김
 *   - title/outcome/indexLabel은 모든 상태에서 렌더
 *
 * next-intl Link는 테스트 환경에서 plain <a>로 모킹해 locale-aware 종속성 제거.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { MilestoneDefinition } from "@vibestart/shared-types";

afterEach(() => {
  cleanup();
});

// next-intl Link를 단순 <a>로 대체
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { MilestoneCard } from "./milestone-card";

const fakeMilestone: MilestoneDefinition = {
  id: "m1-deploy",
  track: "static",
  order: 1,
  titleKey: "Milestones.m1-deploy.title",
  outcomeKey: "Milestones.m1-deploy.outcome",
  shortDescriptionKey: "Milestones.m1-deploy.short",
  previewKind: "vercel-deploy",
  unlocks: "m2-google-auth",
  substeps: [],
  mcpInstalls: [],
};

function renderCard(overrides: Partial<React.ComponentProps<typeof MilestoneCard>> = {}) {
  return render(
    <MilestoneCard
      milestone={fakeMilestone}
      state="in_progress"
      variant="tree-node"
      indexLabel="M1/5"
      title="인터넷에 내 사이트가 뜬다"
      outcome="친구한테 링크를 보낼 수 있어요"
      lockedHint="이전 단계를 완료하면 열려요"
      href="/projects/abc/m/m1-deploy"
      {...overrides}
    />,
  );
}

describe("<MilestoneCard />", () => {
  it("renders title, outcome, and index label when in progress", () => {
    renderCard({ state: "in_progress" });

    expect(screen.getByText("인터넷에 내 사이트가 뜬다")).toBeInTheDocument();
    expect(screen.getByText("친구한테 링크를 보낼 수 있어요")).toBeInTheDocument();
    expect(screen.getByText("M1/5")).toBeInTheDocument();
    expect(
      screen.queryByText("이전 단계를 완료하면 열려요"),
    ).not.toBeInTheDocument();
  });

  it("wraps content in a link when state is not locked", () => {
    renderCard({ state: "in_progress", href: "/projects/abc/m/m1-deploy" });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/abc/m/m1-deploy");
  });

  it("shows lockedHint and omits the link when locked", () => {
    renderCard({ state: "locked" });

    expect(screen.getByText("이전 단계를 완료하면 열려요")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("marks the article with data-disabled when locked", () => {
    renderCard({ state: "locked" });
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("data-disabled", "true");
    expect(article.getAttribute("data-state")).toBe("locked");
  });

  it.each(["in_progress", "completed", "failed", "locked"] as const)(
    "exposes data-state=%s attribute on the article",
    (state) => {
      renderCard({ state });
      expect(screen.getByRole("article").getAttribute("data-state")).toBe(
        state,
      );
    },
  );
});
