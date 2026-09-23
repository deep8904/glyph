import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton'

// Same shape as an opportunity row (eyebrow, role, excerpt, meta) so the board does not jump.
export default function CollaborateLoading() {
  return (
    <DiscoveryFrame label="Collaborate">
      {() => (
        <LoadingRegion label="Loading opportunities">
          <Skeleton className="mb-6 h-7 w-40" />
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 py-4">
                <Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full max-w-prose" /><Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </LoadingRegion>
      )}
    </DiscoveryFrame>
  )
}
