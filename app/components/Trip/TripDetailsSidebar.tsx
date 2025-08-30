import {
  BadgeCheck,
  BadgeInfo,
  CalendarIcon,
  Contact,
  Ellipsis,
  MapPinIcon,
  Plus,
  Send,
  UserX,
} from 'lucide-react'

import { formattedDate, formattedDateRange } from '~/lib/date'
import {
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import StaticMapImage from '../StaticMapImage'
import { AspectRatio } from '../ui/aspect-ratio'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

type TripDetailsSidebarProps = {
  trip: Trip
  users?: User[]
}

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
              <Plus className="h-4 w-4" />
              {/* TODO: add action to show/hide declined and removed members */}
              <Ellipsis className="h-4 w-4" />
            </div>
          </SubHeading>
          {Object.values(trip.tripMembers).map((member) => {
            const user = users?.find((user) => user.id === member.uid)
            if (!user) {
              return null
            }

            return (
              <SidebarItem key={member.uid}>
                <div key={member.uid} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="border">
                      <AvatarImage
                        src={user.photoURL}
                        gravatarEmail={user.email}
                        alt={`${user.username} avatar`}
                      />
                      <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{user.displayName}</span>
                      <span className="text-muted-foreground text-xs">
                        @{user.username.toLocaleLowerCase()}
                      </span>
                    </div>
                  </div>
                  {member.status === TripMemberStatus.Owner && (
                    <Badge variant="primary">
                      <BadgeCheck /> Trip Creator
                    </Badge>
                  )}
                  {member.status === TripMemberStatus.Pending && (
                    <Badge variant="success">
                      <Send />
                      Invited
                    </Badge>
                  )}
                  {member.status === TripMemberStatus.Accepted && (
                    <Badge variant="secondary">
                      <Contact /> Trip Member
                    </Badge>
                  )}
                  {member.status === TripMemberStatus.Declined && (
                    <Badge variant="destructive">
                      <UserX /> Declined
                    </Badge>
                  )}
                  {member.status === TripMemberStatus.Removed && (
                    <Badge variant="destructive">
                      <UserX /> Removed
                    </Badge>
                  )}
                </div>
              </SidebarItem>
            )
          })}

          <SubHeading>
            Details <Ellipsis className="h-4 w-4" />
          </SubHeading>
          <SidebarItem>
            <div className="flex items-center gap-2 text-sm">
              <BadgeInfo className="h-4 w-4" />
              {trip.name}
            </div>
          </SidebarItem>
          <SidebarItem>
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" />
              {formattedDateRange(trip.startDate.seconds * 1000, trip.endDate.seconds * 1000)}
            </div>
          </SidebarItem>
          <SidebarItem>
            <div className="flex items-center gap-2 text-sm">
              <MapPinIcon className="h-4 w-4" />
              {trip.startingPoint}
            </div>
          </SidebarItem>
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
            <div className="text-sidebar-foreground/70 ring-sidebar-border flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0">
              Created {formattedDate(new Date(trip.created.seconds * 1000))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default TripDetailsSidebar
