import Logout from '~/components/LogoutButton'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { SoundsToggle } from '~/components/SoundsToggle'
import { ThemeToggle } from '~/components/ThemeToggle'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Settings | Packup' }]
}

export default function Settings() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Settings', href: '/settings' }]} />
      <PageContent>
        <ThemeToggle />
        <SoundsToggle />
        <Logout />
      </PageContent>
    </>
  )
}
