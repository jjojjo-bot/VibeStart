import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata(locale, "complete");
}

export default function CompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
