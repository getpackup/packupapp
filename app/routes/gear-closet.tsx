import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import useAuth from '~/contexts/auth/useAuth'
import { useGearClosetQuery } from '~/services/gear'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Gear Closet | Packup' }]
}

export default function GearCloset() {
  const { user } = useAuth()

  const {
    data: gear,
    isLoading,
    error,
    refetch,
  } = useGearClosetQuery({
    userId: user?.uid ?? "",
    queryOptions: {
      enabled: !!user?.uid
    }
  })

  if (!isLoading) {
    console.log('Done loading gear')
    console.log('error', error)
    console.log('gear', gear)
  } else {
    console.log('Loading gear...')
  }

  return (
    <>
      <PageHeader crumbs={[{ label: 'Gear Closet', href: '/gear-closet' }]} />
      <PageContent>
        <div className="relative flex h-full min-h-0">
          <div className="w-2/3 overflow-y-auto p-8">
            <p>Section for a list of gear items with search/filters</p>
          </div>
          <div className="bg-sidebar border-sidebar-border w-1/3 overflow-y-auto border-l">
            <p>Section for selected item's info and option to edit/save</p>
          </div>
        </div>
      </PageContent>
    </>
  )
}
