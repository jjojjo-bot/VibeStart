"use client";

import { useState } from "react";
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
      <label htmlFor="project-name" className="sr-only">프로젝트 이름</label>
      <Input
        id="project-name"
        value={composing ? raw : value}
        onChange={(e) => handleChange(e.target.value)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={(e) => handleCompositionEnd(e.currentTarget.value)}
        placeholder="my-first-app"
        className="h-12 text-lg"
      />
      <p className="text-sm text-muted-foreground">
        영문 소문자, 숫자, 하이픈(-)만 사용할 수 있어요.
        <br />
        이 이름이 프로젝트 폴더 이름이 됩니다.
      </p>
      {value && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          생성될 폴더: <code className="text-foreground">~/{value}</code>
        </div>
      )}
    </div>
  );
}
