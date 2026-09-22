'use client'

import { useState } from 'react'
import { MoreHorizontal, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Dialog, DialogContent, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/Dialog'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/Menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Tabs, TabsContent, TabsList, TabsTrigger, TabLinks } from '@/components/ui/Tabs'
import { toast } from '@/components/ui/Toast'

export function DesignInteractive() {
  const [tab, setTab] = useState('overview')
  return (
    <div className="space-y-8">
      <div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList aria-label="Project sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="devlogs">Devlogs</TabsTrigger>
            <TabsTrigger value="playtest">Playtest</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="text-small text-fg-secondary">Overview panel. Arrow keys move between tabs.</TabsContent>
          <TabsContent value="devlogs" className="text-small text-fg-secondary">Devlogs panel.</TabsContent>
          <TabsContent value="playtest" className="text-small text-fg-secondary">Playtest panel.</TabsContent>
        </Tabs>
        <TabLinks className="mt-6" label="Route tabs (each is a URL)" activeHref="/design" items={[{ href: '/design', label: 'Overview' }, { href: '/explore', label: 'Devlogs', count: 12 }]} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Menu>
          <MenuTrigger asChild><IconButton variant="secondary" label="More actions"><MoreHorizontal aria-hidden className="size-4" strokeWidth={1.75} /></IconButton></MenuTrigger>
          <MenuContent>
            <MenuLabel>Project</MenuLabel>
            <MenuItem onSelect={() => toast('Link copied', { tone: 'success' })}>Copy link</MenuItem>
            <MenuItem>Edit</MenuItem>
            <MenuSeparator />
            <MenuItem danger>Delete…</MenuItem>
          </MenuContent>
        </Menu>

        <Popover>
          <PopoverTrigger asChild><Button variant="secondary" size="sm"><SlidersHorizontal aria-hidden className="size-4" strokeWidth={1.75} />Filters</Button></PopoverTrigger>
          <PopoverContent><p>Filter controls go here. Escape closes; focus returns to the button.</p></PopoverContent>
        </Popover>

        <Dialog>
          <DialogTrigger asChild><Button variant="secondary">Open dialog</Button></DialogTrigger>
          <DialogContent title="Request playtest access" description="The developer will review your request.">
            <p className="text-small text-fg-secondary">Focus is trapped here, Escape closes, and focus returns to the trigger.</p>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <DialogClose asChild><Button variant="primary" onClick={() => toast('Request sent', { tone: 'success' })}>Send request</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild><Button variant="secondary">Open drawer (right)</Button></DialogTrigger>
          <DialogContent side="right" title="Filters" description="Drawer variant of the same dialog.">
            <p className="text-small text-fg-secondary">Used for mobile navigation and filters.</p>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild><Button variant="secondary">Open sheet (bottom)</Button></DialogTrigger>
          <DialogContent side="bottom" title="Sort and filter">
            <p className="text-small text-fg-secondary">Bottom sheet for narrow screens.</p>
          </DialogContent>
        </Dialog>

        <Button variant="secondary" onClick={() => toast('Saved')}>Toast</Button>
        <Button variant="secondary" onClick={() => toast('Could not save', { tone: 'danger', description: 'Your changes are still in the form.' })}>Error toast</Button>
      </div>
    </div>
  )
}
