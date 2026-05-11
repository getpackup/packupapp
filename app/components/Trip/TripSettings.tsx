import { Settings } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '~/contexts/auth/useAuth'
import { useDeleteTrip, useUpdateTrip } from '~/services/trips'
import type { Trip } from '~/types/Trip'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'

export function TripSettings({ trip }: { trip: Trip }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [leaveConfirm, setLeaveConfirm] = useState('')
  const { mutateAsync: deleteTrip, isPending: isDeleting } = useDeleteTrip()
  const { mutateAsync: updateTrip } = useUpdateTrip(trip.tripId)

  const isOwner = user?.uid === trip.owner
  const currentMember = user?.uid ? trip.tripMembers[user.uid] : undefined
  const globalOptOut = user?.preferences?.safetyItineraryEnabled === false
  const isOptedOut = currentMember?.safetyItineraryOptedOut ?? false

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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setDeleteConfirm(''); setLeaveConfirm('') }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" aria-label="Trip settings">
          <Settings className="h-4 w-4" />
          Trip Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trip Settings</DialogTitle>
          <DialogDescription>Manage your settings for this trip.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="safety-itinerary"
              aria-label="Safety Itinerary"
              checked={!isOptedOut && !globalOptOut}
              disabled={globalOptOut}
              onCheckedChange={handleToggleSafetyItinerary}
            />
            <div className="grid gap-1">
              <Label htmlFor="safety-itinerary">Safety Itinerary</Label>
              {globalOptOut && (
                <p className="text-muted-foreground text-xs">
                  Safety Itinerary is globally disabled. Go to{' '}
                  <Link to="/settings" className="underline">
                    Settings
                  </Link>{' '}
                  to enable it.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {isOwner ? (
            <div className="space-y-3">
              <h4 className="text-destructive text-sm font-medium">Delete Trip</h4>
              <p className="text-muted-foreground text-sm">
                This will permanently delete &ldquo;{trip.name}&rdquo;. This action cannot be undone.
              </p>
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
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Leave Trip</h4>
              <p className="text-muted-foreground text-sm">
                You will be removed from this trip. Other members will still see you in the Safety Itinerary.
              </p>
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
