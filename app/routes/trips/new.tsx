import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'

import type { Route } from './+types/new'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'New Trip | Packup' }]
}

export default function NewTrip() {
  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Trips', href: '/trips' },
          { label: 'Create New Trip', href: '/trips/new' },
        ]}
      />
      <PageContent>
        <div className="w-full max-w-4xl">
          <p>Create a new trip form will go here</p>
        </div>
      </PageContent>
    </>
  )
}
