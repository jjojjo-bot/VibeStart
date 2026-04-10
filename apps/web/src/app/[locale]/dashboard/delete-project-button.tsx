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
      <div
        className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
        onClick={(e) => e.preventDefault()}
      >
        <p className="text-xs text-muted-foreground">
          {t("deleteWarning")}
        </p>
        <div className="flex items-center gap-1.5">
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
            className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {pending ? "..." : t("confirmDelete")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setConfirming(false);
            }}
            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
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
