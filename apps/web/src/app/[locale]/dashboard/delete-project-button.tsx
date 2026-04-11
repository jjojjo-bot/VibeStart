"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteProjectAction } from "./actions";

export function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}): React.ReactNode {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const t = useTranslations("Projects");

  if (confirming) {
    return (
      <div className="relative">
        <div
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-background p-2 shadow-lg"
          onClick={(e) => e.preventDefault()}
        >
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {t("confirmDelete")}?
          </p>
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              setPending(true);
              const fd = new FormData();
              fd.set("projectId", projectId);
              await deleteProjectAction(fd);
              setPending(false);
              setConfirming(false);
            }}
            disabled={pending}
            className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20 disabled:opacity-50 whitespace-nowrap"
          >
            {pending ? "..." : t("confirmDelete")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setConfirming(false);
            }}
            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted whitespace-nowrap"
          >
            {t("cancelDelete")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setConfirming(true);
      }}
      className="rounded p-1.5 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
      title={t("deleteProject")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
    </button>
  );
}
