/**
 * GitPushPanel — M1의 git push copy-paste 패널.
 *
 * GitHub repo가 생성된 후, 사용자가 로컬 Next.js 프로젝트를 push할 수 있도록
 * git 명령어를 보여준다. "완료" 버튼을 누르면 서버에 substep 완료를 저장한다.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GitPushPanelProps {
  projectName: string;
  githubUsername: string | null;
  repoCreated: boolean;
  completed: boolean;
  labels: {
    title: string;
    description: string;
    copyButton: string;
    copiedButton: string;
    doneButton: string;
    waitingRepo: string;
    completedMessage: string;
  };
  /** 완료 마킹 서버 액션 */
  onComplete?: () => Promise<void>;
}

export function GitPushPanel({
  projectName,
  githubUsername,
  repoCreated,
  completed,
  labels,
  onComplete,
}: GitPushPanelProps): React.ReactNode {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const repoUrl = githubUsername
    ? `https://github.com/${githubUsername}/${projectName}.git`
    : `https://github.com/<username>/${projectName}.git`;

  const commands = `cd ~/${projectName}
rm -rf frontend/.git
echo ".DS_Store" >> .gitignore
git init
git add .
git commit -m "first commit"
git remote add origin ${repoUrl}
git branch -M main
git push -u origin main`;

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(commands);
    } catch {
      const el = document.createElement("textarea");
      el.value = commands;
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

  async function handleComplete(): Promise<void> {
    if (!onComplete) return;
    setSaving(true);
    try {
      await onComplete();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const disabled = !repoCreated;

  return (
    <section
      className={cn(
        "mb-8 rounded-lg border border-border bg-card p-5",
        completed && "border-primary/40 bg-primary/5",
      )}
    >
      <h2 className="mb-1 text-sm font-medium text-muted-foreground">
        {labels.title}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">{labels.description}</p>

      {disabled ? (
        <div className="rounded-md border border-border bg-background/40 p-3 text-sm text-muted-foreground">
          {labels.waitingRepo}
        </div>
      ) : (
        <>
          <div className="relative rounded-lg border border-border bg-background/80 p-4 pr-24">
            <pre className="overflow-x-auto text-sm text-foreground/80 whitespace-pre leading-relaxed font-mono">
              {commands}
            </pre>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="absolute right-3 top-3"
            >
              {copied ? labels.copiedButton : labels.copyButton}
            </Button>
          </div>

          {completed ? (
            <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              ✅ {labels.completedMessage}
            </div>
          ) : (
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={handleComplete} disabled={saving}>
                {saving ? "..." : labels.doneButton}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
