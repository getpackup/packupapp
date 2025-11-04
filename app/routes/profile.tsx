import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Profile | Packup' }]
}

export default function Profile() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Profile', href: '/profile' }]} />
      <PageContent>
        <p>Profile will go here</p>
      </PageContent>
    </>
  )
}
