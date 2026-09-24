import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { ProjectForm } from '@/components/dashboard/ProjectForm'

export default async function NewProjectPage() {
  const { user, displayName, email, nav } = await getSidebarIdentity()

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="New Project">
      <div className="max-w-2xl">
        <h1 className="mb-1 text-h1 font-semibold tracking-tight text-fg">New Project</h1>
        <p className="mb-8 text-small text-fg-secondary">Fill in the details — you can always edit later. Save as a draft if you&rsquo;re not ready to publish yet.</p>
        <ProjectForm ownerId={user.id} />
      </div>
    </AppShell>
  )
}
