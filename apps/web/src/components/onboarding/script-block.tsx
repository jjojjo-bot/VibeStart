"use client";

import { useState } from "react";
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
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}

export function ScriptBlock({ script }: ScriptBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const success = await copyToClipboard(script);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative rounded-lg bg-background/80 border border-border/50 p-4 pr-20">
      <pre className="overflow-x-auto text-sm text-muted-foreground whitespace-pre-wrap break-all">
        {script}
      </pre>
      <Button
        size="sm"
        onClick={handleCopy}
        className="absolute right-3 top-3"
      >
        {copied ? "복사됨!" : "복사"}
      </Button>
    </div>
  );
}
