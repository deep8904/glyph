import { Shell } from '@/components/shell/Shell'
import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton'

// Same shape as a feed entry (avatar, actor line, title, excerpt) so the page does not jump.
export default function FeedLoading() {
  return (
    <Shell headerLabel="Feed">
      <LoadingRegion label="Loading feed">
        <div className="mx-auto w-full max-w-2xl">
          <Skeleton className="mb-2 h-7 w-16" />
          <Skeleton className="mb-6 h-4 w-72 max-w-full" />
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 py-5">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
    </Shell>
  )
}
