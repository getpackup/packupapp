import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Support | Packup' }]
}

export default function Support() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Support', href: '/support' }]} />
      <PageContent>
        <p>Support will go here</p>
      </PageContent>
    </>
  )
}
