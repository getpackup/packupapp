import { BadgeInfo, CalendarIcon, Ellipsis, Info, MapPinIcon } from 'lucide-react'
import { useState } from 'react'

import { formattedDate, formattedDateRange } from '~/lib/date'
import {
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'
import type { Trip } from '~/types/Trip'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import StaticMapImage from '../StaticMapImage'
import { AspectRatio } from '../ui/aspect-ratio'
import { Badge } from '../ui/badge'
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
import { EditTripLocation } from './EditTripLocation'
import { EditTripName } from './EditTripName'
import TripPartyMemberBadge from './TripPartyMemberBadge'

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
  return (
    <div className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg px-3 py-2 transition-colors">
      {children}
    </div>
  )
}

const SubHeading = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center justify-between rounded-md px-3 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0">
      {children}
    </div>
  )
}

const TripDetailsSidebar = ({ trip, users }: TripDetailsSidebarProps) => {
  const [showAllMembers, setShowAllMembers] = useState(false)
  const tripMembers = showAllMembers
    ? Object.values(trip.tripMembers)
    : acceptedTripMembersOnly(Object.values(trip.tripMembers))

  const onlyActivityTags = trip
    ? trip.tags.filter((item) => gearListActivities.some((activity) => item === activity.label))
    : []

  const onlyAccommodationOrCampKitchenTags = trip
    ? trip.tags.filter(
        (item) =>
          gearListAccommodations.some((activity) => item === activity.label) ||
          gearListCampKitchen.some((activity) => item === activity.label)
      )
    : []

  const onlyOtherConsiderationsTags = trip
    ? trip.tags.filter((item) =>
        gearListOtherConsiderations.some((activity) => item === activity.label)
      )
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
        <div className="space-y-2">
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
                  <div className="flex items-center justify-between gap-2">
                    <UserMediaObject user={user} />
                    <TripPartyMemberBadge member={member} />
                  </div>
                </SidebarItem>
              )
            })}

          <SubHeading>Details</SubHeading>
          <EditTripName tripName={trip.name}>
            <SidebarItem>
              <div className="flex items-center gap-2 text-sm">
                <BadgeInfo className="h-4 w-4" />
                {trip.name}
              </div>
            </SidebarItem>
          </EditTripName>
          <EditTripDates startDate={trip.startDate} endDate={trip.endDate}>
            <SidebarItem>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4" />
                {formattedDateRange(trip.startDate.seconds * 1000, trip.endDate.seconds * 1000)}
              </div>
            </SidebarItem>
          </EditTripDates>
          <EditTripLocation lat={trip.lat} lng={trip.lng} startingPoint={trip.startingPoint}>
            <SidebarItem>
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-4 w-4" />
                {trip.startingPoint}
              </div>
            </SidebarItem>
          </EditTripLocation>
          {trip.description && (
            <SidebarItem>
              <div className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                {trip.description}
              </div>
            </SidebarItem>
          )}
          <Separator className="mt-4" />
          <SubHeading>
            Activities <Ellipsis className="h-4 w-4" />
          </SubHeading>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyActivityTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </SidebarItem>
          <SubHeading>
            Accommodations/Kitchen <Ellipsis className="h-4 w-4" />
          </SubHeading>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyAccommodationOrCampKitchenTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </SidebarItem>
          <SubHeading>
            Other Considerations <Ellipsis className="h-4 w-4" />
          </SubHeading>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyOtherConsiderationsTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </SidebarItem>
          <Separator className="mt-4" />

          {!!trip && !!trip.created && (
            <SubHeading>Created {formattedDate(new Date(trip.created.seconds * 1000))}</SubHeading>
          )}
        </div>
      </div>
    </>
  )
}

export default TripDetailsSidebar
