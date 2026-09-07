"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ScriptBlockProps {
  script: string;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback: textarea를 이용한 복사
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try { return document.execCommand("copy"); }
    catch { return false; }
    finally { document.body.removeChild(textarea); }
  }
}

export function ScriptBlock({ script }: ScriptBlockProps) {
  const t = useTranslations("Common");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const tw = useTranslations("Wizard");

  async function handleCopy() {
    const success = await copyToClipboard(script);
    setFailed(!success);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-w-0 rounded-lg bg-background/80 border border-border/50 p-4">
      <pre className="max-h-64 overflow-auto text-sm text-muted-foreground whitespace-pre-wrap break-all">
        {script}
      </pre>
      <Button
        size="sm"
        onClick={handleCopy}
        className="mt-3"
        aria-label={tw("copyLabel")}
      >
        {copied ? t("copied") : t("copy")}
      </Button>
      {failed && <p role="alert" className="mt-2 text-sm text-amber-500">{tw("copyFailed")}</p>}
      <span role="status" className="sr-only">{copied ? t("copied") : ""}</span>
      <p className="mt-2 text-xs text-muted-foreground/50">
        {t("copyWarning")}
      </p>
    </div>
  );
}
