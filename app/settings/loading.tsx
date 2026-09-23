import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton'

// Renders inside the settings layout, so the navigation stays put while a page loads.
export default function SettingsLoading() {
  return (
    <LoadingRegion label="Loading settings">
      <Skeleton className="mb-6 h-7 w-32" />
      <div className="max-w-md space-y-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
        ))}
      </div>
    </LoadingRegion>
  )
}
