import Image from "next/image";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type ContentBlockKind = "code" | "prompt" | "error" | "output";

const blockStyles: Record<ContentBlockKind, string> = {
  code: "border-border/70 bg-muted/70 text-foreground",
  prompt: "border-violet-400/40 bg-violet-500/10 text-violet-50",
  error: "border-red-400/40 bg-red-500/10 text-red-50",
  output: "border-emerald-400/40 bg-emerald-500/10 text-emerald-50",
};

function ContentBlock({
  kind,
  label,
  children,
}: {
  kind: ContentBlockKind;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={`not-prose my-6 overflow-hidden rounded-xl border ${blockStyles[kind]}`}>
      <div className="border-b border-current/10 px-4 py-2 font-mono text-[11px] font-bold tracking-[0.16em] opacity-70">
        {label}
      </div>
      <div className="overflow-x-auto px-4 py-3 font-mono text-sm leading-6 [&>pre]:m-0 [&>pre]:bg-transparent [&>pre]:p-0 [&>p]:m-0">
        {children}
      </div>
    </div>
  );
}

export function CODE({ children, label = "CODE" }: { children: ReactNode; label?: string }) {
  return <ContentBlock kind="code" label={label}>{children}</ContentBlock>;
}

export function PROMPT({ children, label = "PROMPT" }: { children: ReactNode; label?: string }) {
  return <ContentBlock kind="prompt" label={label}>{children}</ContentBlock>;
}

export function ERROR({ children, label = "ERROR" }: { children: ReactNode; label?: string }) {
  return <ContentBlock kind="error" label={label}>{children}</ContentBlock>;
}

export function OUTPUT({ children, label = "OUTPUT" }: { children: ReactNode; label?: string }) {
  return <ContentBlock kind="output" label={label}>{children}</ContentBlock>;
}

interface ScreenshotProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export function Screenshot({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
}: ScreenshotProps) {
  return (
    <figure className="not-prose my-8">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/30 shadow-2xl shadow-black/20">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 768px) 100vw, 768px"
          className="h-auto w-full"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function BlogAnchor({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...props} rel={props.rel ?? "noopener noreferrer"}>
      {children}
    </a>
  );
}

function BlogPre({ children }: ComponentPropsWithoutRef<"pre">) {
  return <CODE>{children}</CODE>;
}

function BlogTable(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-6 w-full overflow-x-auto rounded-lg border border-border/60">
      <table {...props} className="my-0 min-w-[36rem] border-0" />
    </div>
  );
}

export const blogMdxComponents = {
  a: BlogAnchor,
  pre: BlogPre,
  table: BlogTable,
  CODE,
  PROMPT,
  ERROR,
  OUTPUT,
  Screenshot,
};
