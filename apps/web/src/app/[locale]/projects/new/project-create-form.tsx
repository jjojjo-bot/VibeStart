"use client";

import type { ReactNode } from "react";

import { trackProjectCreate } from "@/lib/ga";

interface ProjectCreateFormProps {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}

export function ProjectCreateForm({
  action,
  children,
}: ProjectCreateFormProps): React.ReactNode {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const track = (fd.get("trackId") as string | null) ?? "unknown";
        trackProjectCreate(track);
      }}
      className="space-y-8"
    >
      {children}
    </form>
  );
}
