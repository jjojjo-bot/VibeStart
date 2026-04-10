"use client";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OS, Goal } from "@/lib/onboarding";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

interface PlanItem {
  name: string;
  description: string;
  icon: string;
}

function getPlanItems(os: OS, goal: Goal, t: ReturnType<typeof useTranslations<"Plan">>): PlanItem[] {
  const items: PlanItem[] = [];

  items.push({
    name: t("tools.git.name"),
    description: t("tools.git.description"),
    icon: "📦",
  });

  // 프론트엔드가 있는 Goal은 Node.js 필요
  if (goal === "web-nextjs" || goal === "web-python" || goal === "web-java" || goal === "not-sure") {
    items.push({
      name: t("tools.nodejs.name"),
      description: t("tools.nodejs.description"),
      icon: "🟢",
    });
  }

  // 추가 런타임
  if (goal === "web-python" || goal === "data-ai") {
    items.push({
      name: "Python",
      description: goal === "data-ai" ? t("tools.python.description.dataAi") : t("tools.python.description.backend"),
      icon: "🐍",
    });
  } else if (goal === "web-java") {
    items.push({
      name: t("tools.java.name"),
      description: t("tools.java.description"),
      icon: "☕",
    });
  } else if (goal === "mobile") {
    items.push({
      name: t("tools.expo.name"),
      description: t("tools.expo.description"),
      icon: "📱",
    });
  }

  items.push({
    name: t("tools.vscode.name"),
    description: t("tools.vscode.description"),
    icon: "💻",
  });

  items.push({
    name: t("tools.claudeCode.name"),
    description: t("tools.claudeCode.description"),
    icon: "🤖",
  });

  // 프로젝트 생성
  if (goal === "web-nextjs" || goal === "not-sure") {
    items.push({
      name: t("tools.nextjsProject.name"),
      description: t("tools.nextjsProject.description"),
      icon: "🚀",
    });
  } else if (goal === "web-python") {
    items.push({
      name: t("tools.nextjsFastapiProject.name"),
      description: t("tools.nextjsFastapiProject.description"),
      icon: "🚀",
    });
  } else if (goal === "web-java") {
    items.push({
      name: t("tools.nextjsSpringProject.name"),
      description: t("tools.nextjsSpringProject.description"),
      icon: "🚀",
    });
  } else if (goal === "mobile") {
    items.push({
      name: t("tools.expoProject.name"),
      description: t("tools.expoProject.description"),
      icon: "🚀",
    });
  } else if (goal === "data-ai") {
    items.push({
      name: t("tools.jupyterProject.name"),
      description: t("tools.jupyterProject.description"),
      icon: "🚀",
    });
  }

  return items;
}

function PlanContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("Plan");
  const tc = useTranslations("Common");

  const os = (searchParams.get("os") ?? "windows") as OS;
  const goal = (searchParams.get("goal") ?? "web-nextjs") as Goal;
  const projectName = searchParams.get("project") ?? "my-first-app";

  const planItems = getPlanItems(os, goal, t);

  const setupParams = new URLSearchParams({
    os,
    goal,
    project: projectName,
  });

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="mb-2 text-center text-3xl font-bold">{t("title")}</h1>
        <p className="mb-10 text-center text-muted-foreground">
          {t("subtitle")}
        </p>

        {/* 플랜 아이템 리스트 */}
        <div className="mb-8 flex flex-col gap-3">
          {planItems.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    Step {i + 1}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 요약 */}
        <div className="mb-8 rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>{t("summary.os")}</span>
            <span className="text-foreground">
              {os === "windows" ? "Windows" : "Mac"}
            </span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>{t("summary.projectName")}</span>
            <code className="text-foreground">{projectName}</code>
          </div>
          <div className="mt-2 flex justify-between">
            <span>{t("summary.estimatedTime")}</span>
            <span className="text-foreground">{t("summary.estimatedTimeValue")}</span>
          </div>
        </div>

        {/* CTA */}
        <Link href={`/setup?${setupParams.toString()}`}>
          <Button className="h-12 w-full text-base">{t("ctaButton")}</Button>
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <Link
            href="/onboarding"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {tc("previous")}
          </Link>
          <p className="text-sm text-muted-foreground/70">
            {t("skipNote")}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PlanPage() {
  return (
    <Suspense>
      <PlanContent />
    </Suspense>
  );
}
