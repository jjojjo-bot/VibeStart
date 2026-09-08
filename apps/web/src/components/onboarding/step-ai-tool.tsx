"use client";

import { useTranslations } from "next-intl";
import type { AiTool } from "@/lib/ai-tools";

interface StepAiToolProps {
  value: AiTool | null;
  onChange: (aiTool: AiTool) => void;
}

const OPTIONS: readonly AiTool[] = ["codex", "claude"];

export function StepAiTool({ value, onChange }: StepAiToolProps) {
  const t = useTranslations("Onboarding.aiToolOptions");
  return (
    <div role="radiogroup" aria-label={t("ariaLabel")} className="grid gap-4">
      {OPTIONS.map((tool) => (
        <button
          key={tool}
          type="button"
          role="radio"
          aria-checked={value === tool}
          onClick={() => onChange(tool)}
          className={`rounded-xl border-2 p-5 text-left transition-all ${
            value === tool
              ? "border-primary bg-primary/10"
              : "border-border/50 bg-card hover:border-primary/50"
          }`}
        >
          <span className="font-semibold">{t(`${tool}.name`)}</span>
          <span className="ml-2 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            {t(`${tool}.badge`)}
          </span>
          <p className="mt-2 text-sm text-muted-foreground">{t(`${tool}.description`)}</p>
        </button>
      ))}
    </div>
  );
}
