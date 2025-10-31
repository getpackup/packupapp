import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Shopping List | Packup' }]
}

export default function ShoppingList() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Shopping List', href: '/shopping-list' }]} />
      <PageContent>
        <p>Shopping list will go here</p>
      </PageContent>
    </>
  )
}
