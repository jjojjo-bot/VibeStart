"use client";

import { Input } from "@/components/ui/input";

interface StepProjectNameProps {
  value: string;
  onChange: (name: string) => void;
}

export function StepProjectName({ value, onChange }: StepProjectNameProps) {
  function handleChange(raw: string) {
    const sanitized = raw
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-/, "");
    onChange(sanitized);
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
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
