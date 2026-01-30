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

  // const constraints = useMemo(() => [where('id', '==', user?.uid)], [user?.uid])

  console.log({ user })

  const {
    data: gear,
    isLoading,
    error,
    refetch,
  } = useGearClosetQuery({
    userId: user?.uid ?? '-1',
    queryOptions: {
      enabled: !!user?.uid,
    },
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
        <p>Gear closet will go here</p>
      </PageContent>
    </>
  )
}
