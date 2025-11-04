import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Feedback | Packup' }]
}

export default function Feedback() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Feedback', href: '/feedback' }]} />
      <PageContent>
        <p>Feedback will go here</p>
      </PageContent>
    </>
  )
}
