import { Settings } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '~/contexts/auth/useAuth'
import { useDeleteTrip, useUpdateTrip } from '~/services/trips'
import type { Trip } from '~/types/Trip'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'

import ResponsiveDialogContainer from '../ResponsiveDialogContainer'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Separator } from '../ui/separator'
import { Switch } from '../ui/switch'

export function TripSettings({ trip }: { trip: Trip }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [leaveConfirm, setLeaveConfirm] = useState('')
  const { mutateAsync: deleteTrip, isPending: isDeleting } = useDeleteTrip()
  const { mutateAsync: updateTrip } = useUpdateTrip(trip.tripId)

  const isOwner = user?.uid === trip.owner
  const currentMember = user?.uid ? trip.tripMembers?.[user.uid] : undefined
  const globalOptOut = user?.preferences?.safetyItineraryEnabled === false
  const isOptedOut = currentMember?.safetyItineraryOptedOut ?? false
  const activeMemberCount = Object.values(trip.tripMembers ?? {}).filter(
    (m) =>
      m.status !== TripMemberStatus.Left &&
      m.status !== TripMemberStatus.Declined &&
      m.status !== TripMemberStatus.Removed
  ).length
  const hasOtherMembers = activeMemberCount > 1

  const updateCurrentMember = async (fields: Partial<TripMember>) => {
    if (!user?.uid || !currentMember) return
    await updateTrip({
      data: {
        [`tripMembers.${user.uid}`]: { ...currentMember, ...fields },
      } as any,
    })
  }

  const handleDelete = async () => {
    await deleteTrip({ tripId: trip.tripId })
    navigate('/trips')
  }

  const handleLeave = async () => {
    await updateCurrentMember({ status: TripMemberStatus.Left })
    navigate('/trips')
  }

  const handleToggleSafetyItinerary = async () => {
    await updateCurrentMember({ safetyItineraryOptedOut: !isOptedOut })
  }

  return (
    <ResponsiveDialogContainer
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        setDeleteConfirm('')
        setLeaveConfirm('')
      }}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          aria-label="Trip settings"
        >
          <Settings className="h-4 w-4" />
          Trip Settings
        </Button>
      }
      title="Trip Settings"
      description="Manage your settings for this trip."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium">Safety Itinerary Email</span>
            <span className="text-muted-foreground text-sm">
              {globalOptOut ? (
                <>
                  Safety Itinerary is globally disabled. Go to{' '}
                  <Link to="/settings" className="underline">
                    Settings
                  </Link>{' '}
                  to enable it.
                </>
              ) : (
                'When enabled, an email with trip details, members, and emergency contacts will be sent the day before your trip starts.'
              )}
            </span>
          </div>
          <div className="shrink-0">
            <Switch
              aria-label="Safety Itinerary Email"
              checked={!isOptedOut && !globalOptOut}
              disabled={globalOptOut}
              onCheckedChange={handleToggleSafetyItinerary}
            />
          </div>
        </div>

        <Separator />

        {isOwner ? (
          <div className="flex flex-col gap-1">
            <h4 className="text-destructive font-base">Delete Trip</h4>
            <p className="text-muted-foreground text-sm">
              This will permanently delete <strong>{trip.name}</strong>.{' '}
              {hasOtherMembers && 'This will delete the trip for all members. '}
              This action cannot be undone.
            </p>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Type DELETE to confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <Button
                variant="destructive"
                disabled={deleteConfirm !== 'DELETE' || isDeleting}
                onClick={handleDelete}
                aria-label="Confirm delete"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <h4 className="text-base font-medium">Leave Trip</h4>
            <p className="text-muted-foreground text-sm">
              You will be removed from this trip. Other members will still see that you left.
            </p>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Type LEAVE to confirm"
                value={leaveConfirm}
                onChange={(e) => setLeaveConfirm(e.target.value)}
              />
              <Button
                variant="destructive"
                disabled={leaveConfirm !== 'LEAVE'}
                onClick={handleLeave}
                aria-label="Confirm leave"
              >
                Confirm Leave
              </Button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialogContainer>
  )
}
