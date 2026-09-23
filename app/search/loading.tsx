import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { LoadingRegion, Skeleton, SkeletonRow } from '@/components/ui/Skeleton'

// Same shape as the result rows so the page does not jump when results arrive.
export default function SearchLoading() {
  return (
    <DiscoveryFrame label="Search" hideSearch={true}>
      {() => (
        <LoadingRegion label="Loading search">
          <Skeleton className="mb-6 h-7 w-28" />
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        </LoadingRegion>
      )}
    </DiscoveryFrame>
  )
}
