"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface StepProjectNameProps {
  value: string;
  onChange: (name: string) => void;
}

function sanitize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/, "");
}

export function StepProjectName({ value, onChange }: StepProjectNameProps) {
  const t = useTranslations("Onboarding");
  const [raw, setRaw] = useState(value);
  const [composing, setComposing] = useState(false);

  function handleChange(input: string) {
    setRaw(input);
    if (!composing) {
      onChange(sanitize(input));
    }
  }

  function handleCompositionEnd(input: string) {
    setComposing(false);
    const sanitized = sanitize(input);
    setRaw(sanitized);
    onChange(sanitized);
  }

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="project-name" className="sr-only">{t("projectName.label")}</label>
      <Input
        id="project-name"
        value={composing ? raw : value}
        onChange={(e) => handleChange(e.target.value)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={(e) => handleCompositionEnd(e.currentTarget.value)}
        placeholder={t("projectName.placeholder")}
        className="h-12 text-lg"
      />
      <p className="text-sm text-muted-foreground whitespace-pre-line">
        {t("projectName.hint")}
      </p>
      {value && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {t("projectName.folderPreview", { name: value })}
        </div>
      )}
    </div>
  );
}
