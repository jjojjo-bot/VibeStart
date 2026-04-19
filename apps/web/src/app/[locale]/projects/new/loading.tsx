import { GlobeLoader } from "@/components/ui/globe-loader";

export default function Loading(): React.ReactNode {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-6">
      <GlobeLoader size={160} />
    </div>
  );
}
