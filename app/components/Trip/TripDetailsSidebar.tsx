import { BadgeInfo, CalendarIcon, Ellipsis, MapPinIcon, MessageSquareMore, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import useAuth from '~/contexts/auth/useAuth'
import { formattedDate, formattedDateRange } from '~/lib/date'
import {
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'
import { getTagDotClass } from '~/lib/tagColors'
import { useCustomTagColorMap } from '~/lib/useCustomTagColorMap'
import { cn } from '~/lib/utils'
import { useGearClosetQuery } from '~/services/gear'
import { useDeleteTrip } from '~/services/trips'
import type { Trip } from '~/types/Trip'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import StaticMapImage from '../StaticMapImage'
import { AspectRatio } from '../ui/aspect-ratio'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Separator } from '../ui/separator'
import UserMediaObject from '../UserMediaObject'
import { AddTripPartyMember } from './AddTripPartyMember'
import { EditTripDates } from './EditTripDates'
import { EditTripDescription } from './EditTripDescription'
import { EditTripLocation } from './EditTripLocation'
import { EditTripName } from './EditTripName'
import { EditTripTags } from './EditTripTags'
import TripPartyMemberBadge from './TripPartyMemberBadge'
import TripWeather from './TripWeather'

type TripDetailsSidebarProps = {
  trip: Trip
  users?: User[]
}

export const acceptedTripMembersOnly = (tripMembers: TripMember[]) =>
  tripMembers.filter(
    (member) =>
      member.status !== TripMemberStatus.Declined && member.status !== TripMemberStatus.Removed
  )

const SidebarItem = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-sidebar-foreground rounded-lg px-3 py-2">{children}</div>
}

const SubHeading = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-sidebar-foreground mt-2 flex shrink-0 items-center justify-between px-3 text-xs leading-relaxed outline-hidden">
      {children}
    </div>
  )
}

const TripDetailsSidebar = ({ trip, users }: TripDetailsSidebarProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { mutateAsync: deleteTrip, isPending: isDeleting } = useDeleteTrip()
  const [showAllMembers, setShowAllMembers] = useState(false)
  const tripMembers = showAllMembers
    ? Object.values(trip.tripMembers)
    : acceptedTripMembersOnly(Object.values(trip.tripMembers))

  const userId = user?.uid ?? ''
  const { data: closet } = useGearClosetQuery({ userId, queryOptions: { enabled: !!userId } })
  const customTagDefs = closet?.customTags ?? []
  const colorMap = useCustomTagColorMap(userId)
  const customTagNames = new Set(customTagDefs.map((ct) => ct.name))

  const onlyCustomTags = trip
    ? trip.tags.filter((tag) => customTagNames.has(tag))
    : []

  const customTagOptions = customTagDefs.map((ct) => ({
    name: ct.name,
    label: ct.name,
  }))

  const onlyActivityTags = trip
    ? trip.tags.filter((item) => gearListActivities.some((tag) => item === tag.label))
    : []

  const onlyAccommodationOrCampKitchenTags = trip
    ? trip.tags.filter(
        (item) =>
          gearListAccommodations.some((tag) => item === tag.label) ||
          gearListCampKitchen.some((tag) => item === tag.label)
      )
    : []

  const onlyOtherConsiderationsTags = trip
    ? trip.tags.filter((item) => gearListOtherConsiderations.some((tag) => item === tag.label))
    : []

  return (
    <>
      <AspectRatio ratio={4}>
        {!trip.headerImage && !!trip.lat && !!trip.lng && (
          <StaticMapImage
            lat={trip.lat}
            lng={trip.lng}
            height="100%"
            width="100%"
            zoom={10}
            label={trip.startingPoint}
          />
        )}
        {trip.headerImage && <img src={trip?.headerImage} alt={trip?.name} />}
      </AspectRatio>
      <div className="p-2">
        <div className="">
          <SubHeading>
            <span>Trip Members</span>
            <div className="flex items-center gap-2">
              <AddTripPartyMember tripMembers={Object.values(trip.tripMembers)} trip={trip} />
              {Object.values(trip.tripMembers)?.some(
                (member) =>
                  member.status === TripMemberStatus.Declined ||
                  member.status === TripMemberStatus.Removed
              ) && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 opacity-80 hover:opacity-100">
                    <Ellipsis className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setShowAllMembers(!showAllMembers)}>
                      Toggle declined & removed members {showAllMembers ? 'off' : 'on'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </SubHeading>
          {tripMembers
            .sort((a, b) => a.invitedAt.seconds - b.invitedAt.seconds)
            .map((member) => {
              const user = users?.find((user) => user.id === member.uid)
              if (!user) {
                return null
              }

              return (
                <SidebarItem key={member.uid}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <UserMediaObject user={user} />
                    <TripPartyMemberBadge member={member} />
                  </div>
                </SidebarItem>
              )
            })}

          <SubHeading>Details</SubHeading>
          <SidebarItem>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-start gap-2 text-left text-sm">
                <BadgeInfo className="mt-0.5 h-4 w-4" />
                {trip.name}
              </div>
              <EditTripName tripName={trip.name}>
                <Button variant="ghost" size="icon-sm">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </EditTripName>
            </div>
          </SidebarItem>
          <SidebarItem>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-start gap-2 text-left text-sm">
                <CalendarIcon className="mt-0.5 h-4 w-4" />
                {formattedDateRange(trip.startDate.seconds * 1000, trip.endDate.seconds * 1000)}
              </div>
              <EditTripDates startDate={trip.startDate} endDate={trip.endDate}>
                <Button variant="ghost" size="icon-sm">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </EditTripDates>
            </div>
          </SidebarItem>

          <SidebarItem>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-start gap-2 text-left text-sm">
                <MapPinIcon className="mt-0.5 h-4 w-4" />
                {trip.startingPoint}
              </div>
              <EditTripLocation lat={trip.lat} lng={trip.lng} startingPoint={trip.startingPoint}>
                <Button variant="ghost" size="icon-sm">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </EditTripLocation>
            </div>
          </SidebarItem>

          <SidebarItem>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-start gap-2 text-left text-sm">
                <MessageSquareMore className="mt-1 h-4 w-4" />
                {trip.description || 'No description provided'}
              </div>
              <EditTripDescription description={trip.description}>
                <Button variant="ghost" size="icon-sm">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </EditTripDescription>
            </div>
          </SidebarItem>

          <Separator className="my-4" />

          {trip.lat && trip.lng && (
            <TripWeather
              lat={trip.lat}
              lng={trip.lng}
              startDate={trip.startDate}
              endDate={trip.endDate}
            />
          )}

          <Separator className="mt-4" />
          <EditTripTags tags={onlyActivityTags} options={gearListActivities} name="Activities">
            <SubHeading>
              Activities{' '}
              <div className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-muted hover:text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                <Ellipsis className="h-4 w-4" />
              </div>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyActivityTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary" className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-block h-2 w-2 shrink-0 rounded-full',
                      getTagDotClass(tag, colorMap)
                    )}
                  />
                  {tag}
                </Badge>
              ))}
            </div>
          </SidebarItem>
          <EditTripTags
            tags={onlyAccommodationOrCampKitchenTags}
            options={[...gearListAccommodations, ...gearListCampKitchen]}
            name="Accommodations/Kitchen"
          >
            <SubHeading>
              Accommodations/Kitchen{' '}
              <div className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-muted hover:text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                <Ellipsis className="h-4 w-4" />
              </div>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyAccommodationOrCampKitchenTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary" className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-block h-2 w-2 shrink-0 rounded-full',
                      getTagDotClass(tag, colorMap)
                    )}
                  />
                  {tag}
                </Badge>
              ))}
            </div>
          </SidebarItem>
          <EditTripTags
            tags={onlyOtherConsiderationsTags}
            options={gearListOtherConsiderations}
            name="Other Considerations"
          >
            <SubHeading>
              Other Considerations{' '}
              <div className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-muted hover:text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                <Ellipsis className="h-4 w-4" />
              </div>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyOtherConsiderationsTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary" className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-block h-2 w-2 shrink-0 rounded-full',
                      getTagDotClass(tag, colorMap)
                    )}
                  />
                  {tag}
                </Badge>
              ))}
            </div>
          </SidebarItem>
          {customTagDefs.length > 0 && (
            <>
              <EditTripTags
                tags={onlyCustomTags}
                options={customTagOptions}
                name="Custom Tags"
              >
                <SubHeading>
                  Custom Tags{' '}
                  <div className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-muted hover:text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                    <Ellipsis className="h-4 w-4" />
                  </div>
                </SubHeading>
              </EditTripTags>
              <SidebarItem>
                <div className="flex flex-wrap items-center gap-2">
                  {onlyCustomTags.map((tag: string) => (
                    <Badge key={`${tag}tag`} variant="secondary" className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-block h-2 w-2 shrink-0 rounded-full',
                          getTagDotClass(tag, colorMap)
                        )}
                      />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </SidebarItem>
            </>
          )}
          <Separator className="my-4" />

          {!!trip && !!trip.created && (
            <SubHeading>
              Created {formattedDate(new Date(trip.created.seconds * 1000))}
              {!!trip.updated && (
                <>
                  <br />
                  Last updated {formattedDate(new Date(trip.updated.seconds * 1000))}
                </>
              )}
            </SubHeading>
          )}

          {user?.uid === trip.owner && (
            <>
              <Separator className="my-4" />
              <div className="px-3 pb-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive w-full justify-start gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete trip
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete trip</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete &ldquo;{trip.name}&rdquo;? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={async () => {
                          await deleteTrip({ tripId: trip.tripId })
                          navigate('/trips')
                        }}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default TripDetailsSidebar
