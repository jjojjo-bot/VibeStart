"use client";

import { AITool, AI_TOOL_OPTIONS } from "@/lib/onboarding";
import { Badge } from "@/components/ui/badge";

interface StepAIToolProps {
  value: AITool | null;
  onChange: (tool: AITool) => void;
}

export function StepAITool({ value, onChange }: StepAIToolProps) {
  return (
    <div className="flex flex-col gap-3">
      {AI_TOOL_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
            value === option.value
              ? "border-primary bg-primary/10"
              : "border-border/50 bg-card hover:border-primary/50"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{option.label}</span>
              {option.recommended && (
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                  추천
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {option.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
