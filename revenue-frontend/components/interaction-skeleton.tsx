import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function InteractionSkeleton() {
  return (
    <Card className="border border-gray-200 overflow-hidden">
      <div className="h-1 w-full bg-gray-200" />
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="pt-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
