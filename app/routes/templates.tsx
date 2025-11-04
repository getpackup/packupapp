import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Packing List Templates | Packup' }]
}

export default function Templates() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Packing List Templates', href: '/templates' }]} />
      <PageContent>
        <p>Packing list templates will go here</p>
      </PageContent>
    </>
  )
}
