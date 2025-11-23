import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import useAuth from '~/contexts/auth/useAuth'
import { useGearClosetQuery } from '~/services/gear'

import type { Route } from './+types/home'
import GearTable from '~/components/ui/gear-table'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Gear Closet | Packup' }]
}

// TODO add gear selection
// TODO add gear update
// TODO add gear delete
export default function GearCloset() {
  const { user } = useAuth()

  const {
    data,
    isLoading,
    error,
  } = useGearClosetQuery({
    userId: user?.uid ?? "",
    queryOptions: {
      enabled: !!user?.uid
    }
  })

  if (error) {
    return (
      <>
        <PageHeader crumbs={[{ label: 'Gear Closet', href: '/gear-closet' }]} />
        <PageContent>
          <div className="relative flex h-full min-h-0">
            <div className="w-2/3 overflow-y-auto p-8">
              <p>An error occured. Please try again later or reach out to support</p>
            </div>
          </div>
        </PageContent>
      </>
    )
  }

  return (
    <>
      <PageHeader crumbs={[{ label: 'Gear Closet', href: '/gear-closet' }]} />
      <PageContent>
        <div className="relative flex h-full min-h-0">
          <div className="w-2/3 overflow-y-auto p-8" style={{scrollbarWidth: 'none'}}>
            { !isLoading &&
              <GearTable data={data ?? []} />
            }
          </div>
          <div className="bg-sidebar border-sidebar-border w-1/3 overflow-y-auto border-l">
            <p>Select an item</p>
          </div>
        </div>
      </PageContent>
    </>
  )
}
