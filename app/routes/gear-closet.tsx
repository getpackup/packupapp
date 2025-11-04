import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Gear Closet | Packup' }]
}

export default function GearCloset() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Gear Closet', href: '/gear-closet' }]} />
      <PageContent>
        <p>Gear closet will go here</p>
      </PageContent>
    </>
  )
}
