import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton'

export default function JamsLoading() {
  return (
    <DiscoveryFrame label="Jams">
      {() => (
        <LoadingRegion label="Loading game jams">
          <Skeleton className="mb-6 h-7 w-40" />
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            {[0, 1, 2].map((i) => <div key={i} className="space-y-2 py-4"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-3 w-2/3" /><Skeleton className="h-4 w-full max-w-prose" /></div>)}
          </div>
        </LoadingRegion>
      )}
    </DiscoveryFrame>
  )
}
