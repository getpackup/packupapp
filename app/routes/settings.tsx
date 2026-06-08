import { format } from 'date-fns'
import { ExternalLink, Loader2, LogOut, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { ChatNotificationsToggle } from '~/components/ChatNotificationsToggle'
import { EmergencyContacts } from '~/components/EmergencyContacts'
import { FriendRequestEmailToggle } from '~/components/FriendRequestEmailToggle'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { SafetyItineraryToggle } from '~/components/SafetyItineraryToggle'
import { SoundsToggle } from '~/components/SoundsToggle'
import { ThemeToggle } from '~/components/ThemeToggle'
import { Button } from '~/components/ui/button'
import WeightUnitPreference from '~/components/WeightUnitPreference'
import { useAuth } from '~/contexts/auth/useAuth'
import { firebaseAuth } from '~/firebase/config'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { usePlan } from '~/lib/usePlan'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Settings | Packup' }]
}

function PreferenceRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-medium">{label}</span>
        <span className="text-muted-foreground text-sm">{description}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const PRICING_URL = 'https://getpackup.com/pricing'

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isAnonymous = useIsAnonymous()
  const { isPro, isFree, isLoading: isPlanLoading } = usePlan()
  const [searchParams] = useSearchParams()
  const isCheckoutReturn = searchParams.get('checkout') === 'success'

  async function handleLogoutAll() {
    if (!user?.uid) return
    setIsLoggingOut(true)
    try {
      const formData = new FormData()
      formData.append('uid', user.uid)
      await fetch('/resource/logout-all', { method: 'POST', body: formData })
      await firebaseAuth.signOut()
      navigate('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <PageHeader crumbs={[{ label: 'Settings', href: '/settings' }]} />
      <PageContent className="space-y-16">
        <section>
          <h2 className="mb-2 text-lg font-bold">Preferences</h2>
          <div className="divide-border divide-y">
            <PreferenceRow label="Display Theme" description="Switch between light and dark mode">
              <ThemeToggle />
            </PreferenceRow>
            <PreferenceRow label="Sounds" description="Enable or disable UI sound effects">
              <SoundsToggle />
            </PreferenceRow>
            <PreferenceRow
              label="Preferred Weight Unit"
              description="Choose your preferred unit for weight measurements when displaying item weights in your packing lists."
            >
              <WeightUnitPreference />
            </PreferenceRow>
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold">Emails</h2>
          <div className="divide-border divide-y">
            <PreferenceRow
              label="Safety Itinerary"
              description="Receive an email the day before your trip with details, members, and emergency contacts. You can disable this on a per-trip basis in Trip Settings as well."
            >
              <SafetyItineraryToggle />
            </PreferenceRow>
            <PreferenceRow
              label="Friend Request"
              description="Receive an email when someone sends you a friend request."
            >
              <FriendRequestEmailToggle />
            </PreferenceRow>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Notifications</h2>
          <div className="divide-border divide-y">
            <PreferenceRow
              label="Chat Notifications"
              description="Receive push notifications when a trip member sends a chat message."
            >
              <ChatNotificationsToggle />
            </PreferenceRow>
          </div>
        </section>

        <EmergencyContacts />

        {!isAnonymous && (
          <section>
            <h2 className="mb-2 text-lg font-bold">Subscription</h2>
            <div className="divide-border divide-y">
              {isCheckoutReturn && isPlanLoading ? (
                <PreferenceRow
                  label="Processing upgrade"
                  description="Your upgrade is processing. This may take a few moments."
                >
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </PreferenceRow>
              ) : isPro ? (
                <PreferenceRow
                  label="Pro Plan"
                  description="Manage your subscription, billing, and payment details."
                >
                  <form action="/resource/manage-subscription" method="post">
                    <input type="hidden" name="uid" value={user?.uid} />
                    <Button variant="outline" type="submit">
                      Manage Subscription
                    </Button>
                  </form>
                </PreferenceRow>
              ) : (
                <PreferenceRow
                  label="Free Plan"
                  description="Unlock Trip Chat, unlimited Trip Members, and Custom Tags."
                >
                  <Button variant="outline" asChild>
                    <a
                      href={`${PRICING_URL}?uid=${user?.uid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      Upgrade to Pro
                    </a>
                  </Button>
                </PreferenceRow>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-lg font-bold">Account</h2>
          {user?.createdAt && (
            <p className="text-muted-foreground text-sm">
              Packup member since {format(user.createdAt.toDate(), 'MMMM do, yyyy')}
            </p>
          )}
          <PreferenceRow
            label="Log out everywhere"
            description="Logs you out of your account on all devices that you may be signed in on."
          >
            <div>
              <Button variant="outline" onClick={handleLogoutAll} disabled={isLoggingOut}>
                <LogOut className="size-4" />
                {isLoggingOut ? 'Logging out…' : 'Log out'}
              </Button>
            </div>
          </PreferenceRow>
          <PreferenceRow
            label="Delete Account"
            description="Permanently delete your account and all associated data."
          >
            <div>
              <Button variant="outline" onClick={() => navigate('/account-delete')}>
                <UserMinus className="size-4" />
                Request Deletion
              </Button>
            </div>
          </PreferenceRow>
        </section>
      </PageContent>
    </>
  )
}
