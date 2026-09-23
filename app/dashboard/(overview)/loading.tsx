import { Shell } from '@/components/shell/Shell'
import { LoadingRegion, Skeleton, SkeletonRow } from '@/components/ui/Skeleton'

// Generic for every /dashboard route (heading + rows), since the segment's loading UI is shared.
export default function DashboardLoading() {
  return (
    <Shell>
      <LoadingRegion label="Loading">
        <div className="max-w-3xl space-y-6">
          <Skeleton className="h-7 w-48" />
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        </div>
      </LoadingRegion>
    </Shell>
  )
}
