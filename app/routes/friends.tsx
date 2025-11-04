import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Friends | Packup' }]
}

export default function Friends() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Friends', href: '/friends' }]} />
      <PageContent>
        <p>Friends will go here</p>
      </PageContent>
    </>
  )
}
