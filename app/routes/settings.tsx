import { EmergencyContacts } from '~/components/EmergencyContacts'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { SafetyItineraryToggle } from '~/components/SafetyItineraryToggle'
import { SoundsToggle } from '~/components/SoundsToggle'
import { ThemeToggle } from '~/components/ThemeToggle'

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

export default function Settings() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Settings', href: '/settings' }]} />
      <PageContent>
        <section className="mb-16">
          <h2 className="mb-2 text-lg font-bold">Preferences</h2>
          <div className="divide-border divide-y">
            <PreferenceRow label="Display Theme" description="Switch between light and dark mode">
              <ThemeToggle />
            </PreferenceRow>
            <PreferenceRow label="Sounds" description="Enable or disable UI sound effects">
              <SoundsToggle />
            </PreferenceRow>
            <PreferenceRow
              label="Safety Itinerary Email"
              description="Receive an email the day before your trip with details, members, and emergency contacts. You can disable this on a per-trip basis in Trip Settings as well."
            >
              <SafetyItineraryToggle />
            </PreferenceRow>
          </div>
        </section>
        <EmergencyContacts />
      </PageContent>
    </>
  )
}
