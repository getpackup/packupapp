import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import NewTripForm from '~/components/Trip/NewTrip'

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
        <div className="mx-auto w-full max-w-4xl">
          <NewTripForm />
        </div>
      </PageContent>
    </>
  )
}
