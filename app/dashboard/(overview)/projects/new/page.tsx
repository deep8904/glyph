import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { ProjectForm } from '@/components/dashboard/ProjectForm'

export default async function NewProjectPage() {
  const { user, displayName, email, nav } = await getSidebarIdentity()

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="New Project">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">New Project</h1>
        <p className="text-sm text-gray-500 mb-8">Fill in the details — you can always edit later.</p>
        <ProjectForm ownerId={user.id} />
      </div>
    </AppShell>
  )
}
