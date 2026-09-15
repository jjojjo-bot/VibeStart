"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { isValidProjectName, type OS } from "@/lib/onboarding";
import {
  buildProjectReadinessScript,
  parseProjectReadiness,
  PROJECT_READINESS_KEYS,
  type ProjectReadinessResult,
} from "@/lib/projects/project-readiness";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectReadinessCheckProps {
  locale: string;
  initialOs: OS;
  continueAction: (formData: FormData) => void | Promise<void>;
}

export function ProjectReadinessCheck({
  locale,
  initialOs,
  continueAction,
}: ProjectReadinessCheckProps): React.ReactNode {
  const t = useTranslations("Readiness");
  const [os, setOs] = useState<OS>(initialOs);
  const [projectName, setProjectName] = useState("my-portfolio");
  const [output, setOutput] = useState("");
  const [result, setResult] = useState<ProjectReadinessResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const validName = isValidProjectName(projectName);
  const script = useMemo(
    () => (validName ? buildProjectReadinessScript(projectName) : ""),
    [projectName, validName],
  );

  function resetResult(): void {
    setResult(null);
    setOutput("");
  }

  async function copyScript(): Promise<void> {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(script);
    } catch {
      setCopyFailed(true);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function checkOutput(): void {
    setResult(parseProjectReadiness(output));
  }

  const quickStartHref = `/onboarding?mode=project-only&os=${os}&project=${encodeURIComponent(projectName)}`;
  const fullSetupHref = `/onboarding?mode=full&os=${os}`;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
            1
          </span>
          <div>
            <h2 className="font-semibold">{t("project.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("project.description")}</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("os.label")}>
          {(["windows", "macos"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={os === value}
              onClick={() => {
                setOs(value);
                resetResult();
              }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                os === value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50",
              )}
            >
              <span className="block font-semibold">
                {value === "windows" ? t("os.windows") : t("os.macos")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {value === "windows" ? t("os.windowsHint") : t("os.macosHint")}
              </span>
            </button>
          ))}
        </div>

        <label htmlFor="readiness-project-name" className="text-sm font-medium">
          {t("project.label")}
        </label>
        <input
          id="readiness-project-name"
          value={projectName}
          onChange={(event) => {
            setProjectName(event.target.value.trim().toLowerCase());
            resetResult();
          }}
          minLength={2}
          maxLength={63}
          pattern="[a-z0-9][a-z0-9-]{0,61}[a-z0-9]"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <p className={cn("mt-2 text-xs", validName ? "text-muted-foreground" : "text-destructive")}>
          {validName ? t("project.hint") : t("project.invalid")}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
            2
          </span>
          <div>
            <h2 className="font-semibold">{t("check.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(os === "windows" ? "check.windowsDescription" : "check.macosDescription")}
            </p>
          </div>
        </div>

        <div className="relative rounded-xl border border-border bg-background/80 p-4 pr-24">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80">
            {validName ? script : t("check.nameFirst")}
          </pre>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!validName}
            onClick={copyScript}
            className="absolute right-3 top-3"
          >
            {copied ? t("check.copied") : t("check.copy")}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("check.readOnly")}</p>
        {copyFailed && <p role="alert" className="mt-2 text-xs text-destructive">{t("check.copyFailed")}</p>}

        <label htmlFor="readiness-output" className="mt-5 block text-sm font-medium">
          {t("check.outputLabel")}
        </label>
        <textarea
          id="readiness-output"
          value={output}
          onChange={(event) => {
            setOutput(event.target.value);
            setResult(null);
          }}
          rows={3}
          placeholder="VIBESTART_READY::git=ok::node=ok::npm=ok::project=ok::next=ok"
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-xs focus:border-primary focus:outline-none"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!validName || output.trim().length === 0}
          onClick={checkOutput}
          className="mt-3 w-full"
        >
          {t("check.submit")}
        </Button>
      </section>

      {result && result.state !== "invalid" && (
        <section aria-live="polite" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-semibold">{t("result.title")}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PROJECT_READINESS_KEYS.map((key) => {
              const ok = result.checks[key] === "ok";
              return (
                <li key={key} className="flex items-center gap-2 rounded-lg bg-background/70 px-3 py-2 text-sm">
                  <span className={ok ? "text-emerald-400" : "text-amber-400"}>{ok ? "✓" : "!"}</span>
                  <span>{t(`items.${key}`)}</span>
                </li>
              );
            })}
          </ul>

          {result.state === "ready" && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="font-semibold text-emerald-400">{t("result.readyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("result.readyDescription")}</p>
              <form action={continueAction} className="mt-4">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="os" value={os} />
                <input type="hidden" name="goal" value="web-nextjs" />
                <input type="hidden" name="project" value={projectName} />
                <Button type="submit" size="lg" className="w-full">
                  {t("result.continue")}
                </Button>
              </form>
            </div>
          )}

          {result.state === "missing-project" && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="font-semibold text-amber-400">{t("result.projectMissingTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("result.projectMissingDescription")}</p>
              <Link href={quickStartHref} className="mt-4 block no-underline">
                <Button size="lg" className="w-full">{t("result.quickStart")}</Button>
              </Link>
            </div>
          )}

          {result.state === "missing-tools" && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="font-semibold text-amber-400">{t("result.toolsMissingTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("result.toolsMissingDescription")}</p>
              <Link href={fullSetupHref} className="mt-4 block no-underline">
                <Button size="lg" className="w-full">{t("result.fullSetup")}</Button>
              </Link>
            </div>
          )}
        </section>
      )}

      {result?.state === "invalid" && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {t("result.invalid")}
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">{t("privacy")}</p>
    </div>
  );
}
