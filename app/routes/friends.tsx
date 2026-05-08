import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { UpgradeAccountGate } from '~/components/UpgradeAccountGate'
import { useIsAnonymous } from '~/lib/useIsAnonymous'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Friends | Packup' }]
}

export default function Friends() {
  const isAnonymous = useIsAnonymous()

  return (
    <>
      <PageHeader crumbs={[{ label: 'Friends', href: '/friends' }]} />
      <PageContent>
        {isAnonymous ? (
          <UpgradeAccountGate message="Create an account to connect with friends">
            <div />
          </UpgradeAccountGate>
        ) : (
          <p>Friends will go here</p>
        )}
      </PageContent>
    </>
  )
}
