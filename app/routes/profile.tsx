import { UserPlus } from 'lucide-react'

import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { SignupForm } from '~/components/SignupForm'
import { useIsAnonymous } from '~/lib/useIsAnonymous'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Profile | Packup' }]
}

export default function Profile() {
  const isAnonymous = useIsAnonymous()

  return (
    <>
      <PageHeader crumbs={[{ label: 'Profile', href: '/profile' }]} />
      <PageContent>
        {isAnonymous ? (
          <div className="mx-auto max-w-md space-y-6 py-8">
            <div className="space-y-2 text-center">
              <div className="bg-muted mx-auto w-fit rounded-full p-4">
                <UserPlus className="text-muted-foreground size-8" />
              </div>
              <h2 className="text-2xl font-bold">Create your profile</h2>
              <p className="text-muted-foreground">
                Save your trips, invite friends, and access your data from any device.
              </p>
            </div>
            <div className="rounded border bg-gray-100/50 p-8 dark:bg-gray-800">
              <SignupForm />
            </div>
          </div>
        ) : (
          <p>Profile will go here</p>
        )}
      </PageContent>
    </>
  )
}
