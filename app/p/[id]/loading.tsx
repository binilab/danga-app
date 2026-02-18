import { Skeleton } from "@/components/ui/Skeleton";

export default function PostDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="h-[440px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-40 w-full max-w-2xl" />
        <Skeleton className="h-32 w-full max-w-2xl" />
      </div>
    </div>
  );
}
