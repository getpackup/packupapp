import { BadgeInfo, CalendarIcon, Ellipsis, MapPinIcon, MessageSquareMore } from 'lucide-react'
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
import { Button } from '../ui/button'
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
    <div className="text-sidebar-foreground ring-sidebar-ring mt-2 flex h-8 shrink-0 items-center justify-between rounded-md px-3 text-xs leading-relaxed font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0">
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
            <div className="flex items-start justify-between gap-2">
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
            <div className="flex items-start justify-between gap-2">
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
            <div className="flex items-start justify-between gap-2">
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
            <div className="flex items-start justify-between gap-2">
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

          <Separator className="mt-4" />
          <EditTripTags tags={onlyActivityTags} options={gearListActivities} name="Activities">
            <SubHeading>
              Activities{' '}
              <p className="p-1 opacity-80 hover:opacity-100">
                <Ellipsis className="h-4 w-4" />
              </p>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyActivityTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary">
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
              <p className="p-1 opacity-80 hover:opacity-100">
                <Ellipsis className="h-4 w-4" />
              </p>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyAccommodationOrCampKitchenTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary">
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
              <p className="p-1 opacity-80 hover:opacity-100">
                <Ellipsis className="h-4 w-4" />
              </p>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyOtherConsiderationsTags.map((tag: string) => (
                <Badge key={`${tag}tag`} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </SidebarItem>
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
        </div>
      </div>
    </>
  )
}

export default TripDetailsSidebar
