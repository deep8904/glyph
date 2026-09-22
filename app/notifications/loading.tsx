import { AppShell } from '@/components/dashboard/AppShell'
import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton'

// Same shape as a notification row (dot, one sentence, time) so the list does not jump.
export default function NotificationsLoading() {
  return (
    <AppShell headerLabel="Notifications">
      <div className="mx-auto w-full max-w-2xl">
        <LoadingRegion label="Loading notifications">
          <Skeleton className="mb-6 h-7 w-44" />
          <div className="divide-y divide-line-subtle border-y border-line-subtle">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <Skeleton className="mt-2 size-2 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </LoadingRegion>
      </div>
    </AppShell>
  )
}
