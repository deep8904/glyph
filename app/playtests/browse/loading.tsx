import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton'

// Same shape as a playtest row (game, developer, what to test, build/places) so the list does not jump.
export default function PlaytestsLoading() {
  return (
    <DiscoveryFrame label="Playtests">
      {() => (
        <LoadingRegion label="Loading playtests">
          <Skeleton className="mb-6 h-7 w-32" />
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 py-4">
                <Skeleton className="h-5 w-1/2" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-full max-w-prose" /><Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </LoadingRegion>
      )}
    </DiscoveryFrame>
  )
}
