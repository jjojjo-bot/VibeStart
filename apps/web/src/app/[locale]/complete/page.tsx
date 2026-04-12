"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { OS, Goal } from "@/lib/onboarding";
import { incrementCompletions } from "@/lib/stats";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { signInFromCompleteAction, goToDashboardWithPhase1Action } from "../login/actions";

function getInstalledTools(goal: Goal): string[] {
  const base = ["Git", "VS Code", "Claude Code"];

  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return [...base, "Node.js"];
    case "web-python":
      return [...base, "Node.js", "Python"];
    case "web-java":
      return [...base, "Node.js", "Java (JDK)"];
    case "mobile":
      return [...base, "Node.js", "Expo"];
    case "data-ai":
      return [...base, "Python"];
  }
}

function getGoalLabelKey(goal: Goal): string {
  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return "goalLabels.webNextjs";
    case "web-python":
      return "goalLabels.webPython";
    case "web-java":
      return "goalLabels.webJava";
    case "mobile":
      return "goalLabels.mobile";
    case "data-ai":
      return "goalLabels.dataAi";
  }
}

function getProjectTreeKey(goal: Goal): string {
  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return "projectTrees.webNextjs";
    case "web-python":
      return "projectTrees.webPython";
    case "web-java":
      return "projectTrees.webJava";
    case "mobile":
      return "projectTrees.mobile";
    case "data-ai":
      return "projectTrees.dataAi";
  }
}

function getPromptTemplateKey(goal: Goal): string {
  if (goal === "data-ai") return "promptTemplates.dataAi";
  if (goal === "mobile") return "promptTemplates.mobile";
  return "promptTemplates.web";
}

function getPromptExampleKey(goal: Goal): string {
  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return "promptExamples.webNextjs";
    case "web-python":
      return "promptExamples.webPython";
    case "web-java":
      return "promptExamples.webJava";
    case "mobile":
      return "promptExamples.mobile";
    case "data-ai":
      return "promptExamples.dataAi";
  }
}

/** v0 ZIP을 풀어야 할 경로 (웹 프로젝트만 해당) */
function getV0UnzipPath(goal: Goal, projectName: string): string | null {
  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return `~/${projectName}/`;
    case "web-python":
    case "web-java":
      return `~/${projectName}/frontend/`;
    case "mobile":
    case "data-ai":
      return null;
  }
}

function PromptCopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const tc = useTranslations("Common");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-lg border border-primary/30 bg-primary/5 p-4 pr-24">
      <pre className="overflow-x-auto text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
        {text}
      </pre>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="absolute right-3 top-3"
      >
        {copied ? tc("copied") : tc("copy")}
      </Button>
    </div>
  );
}

function CompleteContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("Complete");
  const tc = useTranslations("Common");

  const os = (searchParams.get("os") ?? "windows") as OS;
  const goal = (searchParams.get("goal") ?? "web-nextjs") as Goal;
  const projectName = searchParams.get("project") ?? "my-first-app";

  useEffect(() => {
    if (!sessionStorage.getItem("vibestart_completed")) {
      sessionStorage.setItem("vibestart_completed", "1");
      incrementCompletions();
    }
  }, []);

  const tools = getInstalledTools(goal);
  const goalLabel = t(getGoalLabelKey(goal) as Parameters<typeof t>[0]);
  const tree = t(getProjectTreeKey(goal) as Parameters<typeof t>[0], { projectName });
  const promptTemplate = t(getPromptTemplateKey(goal) as Parameters<typeof t>[0]);
  const firstPrompt = t(getPromptExampleKey(goal) as Parameters<typeof t>[0]);
  const v0Path = getV0UnzipPath(goal, projectName);

  // Follow-up examples from translation
  const followUpExamples = [
    t("followUp.examples.0" as Parameters<typeof t>[0]),
    t("followUp.examples.1" as Parameters<typeof t>[0]),
    t("followUp.examples.2" as Parameters<typeof t>[0]),
    t("followUp.examples.3" as Parameters<typeof t>[0]),
    t("followUp.examples.4" as Parameters<typeof t>[0]),
    t("followUp.examples.5" as Parameters<typeof t>[0]),
  ];

  // v0 design steps from translation
  const v0Steps = v0Path ? [
    t("v0Design.steps.0" as Parameters<typeof t>[0]),
    t("v0Design.steps.1" as Parameters<typeof t>[0]),
    t("v0Design.steps.2" as Parameters<typeof t>[0], { v0Path }),
    t("v0Design.steps.3" as Parameters<typeof t>[0]),
  ] : [];

  return (
    <main id="main-content" className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        {/* 축하 */}
        <div className="mb-10 text-center">
          <div className="mb-4 text-6xl">🎉</div>
          <h1 className="text-3xl font-bold">{t("congratulations")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t.rich("envCompleteTemplate", { goalLabel, strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>

        {/* 설치된 도구 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-4 font-semibold">{t("installedTools")}</h2>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <span
                key={tool}
                className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* 프로젝트 구조 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-4 font-semibold">{t("projectStructure")}</h2>
          <pre className="overflow-x-auto rounded-lg bg-background/80 border border-border/30 p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre">
            {tree}
          </pre>
        </div>

        {/* 첫 번째 프롬프트 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-1 font-semibold">{t("firstPrompt.heading")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("firstPrompt.subtitle")}
          </p>

          {/* 빈칸 채우기 템플릿 */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("firstPrompt.templateLabel")}</p>
            <PromptCopyBlock text={promptTemplate} />
          </div>

          {/* 채워진 예시 */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("firstPrompt.exampleLabel")}</p>
            <PromptCopyBlock text={firstPrompt} />
          </div>
        </div>

        {/* 이어서 할 수 있는 대화 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-1 font-semibold">{t("followUp.heading")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("followUp.subtitle")}
          </p>
          <div className="flex flex-col gap-2">
            {followUpExamples.map((example) => (
              <div
                key={example}
                className="rounded-lg bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
              >
                &ldquo;{example}&rdquo;
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60">
            {t("followUp.reassurance")}
          </p>
        </div>

        {/* v0 디자인 팁 (웹 프로젝트만) */}
        {v0Path && (
          <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
            <h2 className="mb-1 font-semibold">{t("v0Design.heading")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              <a href="https://v0.dev" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">v0.dev</a>
              {" "}{t("v0Design.subtitle")}
            </p>
            <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
              {v0Steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Phase 2 진입 — web 트랙만 지원. data-ai/mobile은 Phase 2 마일스톤이 아직 없으므로 안내만. */}
        {goal !== "data-ai" && goal !== "mobile" ? (
        <div className="mb-10 rounded-xl bg-primary/5 border border-primary/20 p-6">
          <div className="mb-2 text-sm text-primary font-medium">
            {t("phase2.badge")}
          </div>
          <h3 className="font-semibold">{t("phase2.heading")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("phase2.description")}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <form action={signInFromCompleteAction}>
              <input type="hidden" name="locale" value="" />
              <input type="hidden" name="os" value={os} />
              <input type="hidden" name="goal" value={goal} />
              <input type="hidden" name="project" value={projectName} />
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                {t("phase2.loginButton")}
              </Button>
            </form>
            <form action={goToDashboardWithPhase1Action}>
              <input type="hidden" name="os" value={os} />
              <input type="hidden" name="goal" value={goal} />
              <input type="hidden" name="project" value={projectName} />
              <Button type="submit" variant="outline" size="lg" className="w-full sm:w-auto">
                {t("phase2.dashboardButton")}
              </Button>
            </form>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("phase2.loginHint")}
          </p>
        </div>
        ) : (
        <div className="mb-10 rounded-xl bg-muted/50 border border-border p-6">
          <h3 className="font-semibold">{t("phase2.comingSoonHeading")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("phase2.comingSoonDescription")}
          </p>
        </div>
        )}

        {/* 다시 시작 */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline">{tc("backToHome")}</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense>
      <CompleteContent />
    </Suspense>
  );
}
