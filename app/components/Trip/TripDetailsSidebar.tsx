import {
  BadgeInfo,
  CalendarIcon,
  Ellipsis,
  MapPinIcon,
  MessageSquareMore,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'

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
import type { Trip } from '~/types/Trip'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import StaticMapImage from '../StaticMapImage'
import { AspectRatio } from '../ui/aspect-ratio'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Separator } from '../ui/separator'
import { Switch } from '../ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import UserMediaObject from '../UserMediaObject'
import { AddTripMember } from './AddTripMember'
import { EditTripDates } from './EditTripDates'
import { EditTripDescription } from './EditTripDescription'
import { EditTripLocation } from './EditTripLocation'
import { EditTripName } from './EditTripName'
import { EditTripTags } from './EditTripTags'
import TripPartyMemberBadge from './TripPartyMemberBadge'
import { TripSettings } from './TripSettings'
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

const SidebarItem = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div className={cn('text-sidebar-foreground rounded-lg px-3 py-2', className)}>{children}</div>
  )
}

const SubHeading = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-sidebar-foreground mt-2 flex shrink-0 items-center justify-between px-3 text-xs leading-relaxed outline-hidden">
      {children}
    </div>
  )
}

const EllipsisButtonWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-muted hover:text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
      {children}
    </div>
  )
}

const TripDetailsSidebar = ({ trip, users }: TripDetailsSidebarProps) => {
  const { user } = useAuth()
  const [showAllMembers, setShowAllMembers] = useState(false)
  const tripMembers = showAllMembers
    ? Object.values(trip.tripMembers)
    : acceptedTripMembersOnly(Object.values(trip.tripMembers))

  const userId = user?.uid ?? ''
  const { data: closet } = useGearClosetQuery({ userId, queryOptions: { enabled: !!userId } })
  const customTagDefs = closet?.customTags ?? []
  const colorMap = useCustomTagColorMap(userId)
  const customTagNames = new Set(customTagDefs.map((ct) => ct.name))

  const removeMemberFromTrip = async (memberId: string) => {
    console.log('removing member', memberId)
  }

  const onlyCustomTags = trip ? trip.tags.filter((tag) => customTagNames.has(tag)) : []

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
              <AddTripMember tripMembers={Object.values(trip.tripMembers)} trip={trip} />
              {Object.values(trip.tripMembers)?.some(
                (member) =>
                  member.status === TripMemberStatus.Declined ||
                  member.status === TripMemberStatus.Removed
              ) && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex items-center justify-start gap-4">
                    <Switch
                      checked={showAllMembers}
                      id="show-declined-removed-members"
                      onCheckedChange={() => setShowAllMembers(!showAllMembers)}
                    />
                    <Label htmlFor="show-declined-removed-members" className="text-xs font-normal">
                      Show declined & removed members
                    </Label>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </SubHeading>
          <div className="divide-border divide-y">
            {tripMembers
              .sort((a, b) => {
                const statusOrder: Record<TripMemberStatus, number> = {
                  [TripMemberStatus.Owner]: 0,
                  [TripMemberStatus.Accepted]: 1,
                  [TripMemberStatus.Pending]: 2,
                  [TripMemberStatus.Declined]: 3,
                  [TripMemberStatus.Removed]: 4,
                  [TripMemberStatus.Left]: 5,
                }

                const statusDiff = statusOrder[a.status] - statusOrder[b.status]
                if (statusDiff !== 0) {
                  return statusDiff
                }

                return a.invitedAt.seconds - b.invitedAt.seconds
              })
              .map((member) => {
                const foundMember = users?.find((user) => user.id === member.uid)
                if (!foundMember) {
                  return null
                }

                return (
                  <SidebarItem key={member.uid} className="group rounded-none">
                    <div className="flex items-center justify-between gap-2">
                      <UserMediaObject user={foundMember} />
                      <div className="flex items-center gap-2">
                        {member.uid !== user?.uid &&
                          (member.status === TripMemberStatus.Pending ||
                            member.status === TripMemberStatus.Accepted) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="opacity-30 group-hover:opacity-100"
                                  onClick={() => removeMemberFromTrip(member.uid)}
                                >
                                  <UserMinus />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove from trip</TooltipContent>
                            </Tooltip>
                          )}
                        {member.uid !== user?.uid &&
                          (member.status === TripMemberStatus.Removed ||
                            member.status === TripMemberStatus.Left) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="opacity-30 group-hover:opacity-100"
                                  onClick={() => removeMemberFromTrip(member.uid)}
                                >
                                  <UserPlus />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Re-invite to trip</TooltipContent>
                            </Tooltip>
                          )}
                        <TripPartyMemberBadge member={member} />
                      </div>
                    </div>
                  </SidebarItem>
                )
              })}
          </div>
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
              <EllipsisButtonWrapper>
                <Ellipsis className="h-4 w-4" />
              </EllipsisButtonWrapper>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyActivityTags.length > 0 ? (
                onlyActivityTags.map((tag: string) => (
                  <Badge
                    key={`${tag}tag`}
                    variant="secondary"
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        'inline-block h-2 w-2 shrink-0 rounded-full',
                        getTagDotClass(tag, colorMap)
                      )}
                    />
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-xs italic">No Activities tags added</p>
              )}
            </div>
          </SidebarItem>
          <EditTripTags
            tags={onlyAccommodationOrCampKitchenTags}
            options={[...gearListAccommodations, ...gearListCampKitchen]}
            name="Accommodations/Kitchen"
          >
            <SubHeading>
              Accommodations/Kitchen{' '}
              <EllipsisButtonWrapper>
                <Ellipsis className="h-4 w-4" />
              </EllipsisButtonWrapper>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyAccommodationOrCampKitchenTags.length > 0 ? (
                onlyAccommodationOrCampKitchenTags.map((tag: string) => (
                  <Badge
                    key={`${tag}tag`}
                    variant="secondary"
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        'inline-block h-2 w-2 shrink-0 rounded-full',
                        getTagDotClass(tag, colorMap)
                      )}
                    />
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  No other Accommodations/Kitchen tags added
                </p>
              )}
            </div>
          </SidebarItem>
          <EditTripTags
            tags={onlyOtherConsiderationsTags}
            options={gearListOtherConsiderations}
            name="Other Considerations"
          >
            <SubHeading>
              Other Considerations{' '}
              <EllipsisButtonWrapper>
                <Ellipsis className="h-4 w-4" />
              </EllipsisButtonWrapper>
            </SubHeading>
          </EditTripTags>
          <SidebarItem>
            <div className="flex flex-wrap items-center gap-2">
              {onlyOtherConsiderationsTags.length > 0 ? (
                onlyOtherConsiderationsTags.map((tag: string) => (
                  <Badge
                    key={`${tag}tag`}
                    variant="secondary"
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        'inline-block h-2 w-2 shrink-0 rounded-full',
                        getTagDotClass(tag, colorMap)
                      )}
                    />
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  No Other Considerations tags added
                </p>
              )}
            </div>
          </SidebarItem>
          {customTagDefs.length > 0 && (
            <>
              <EditTripTags tags={onlyCustomTags} options={customTagOptions} name="Custom Tags">
                <SubHeading>
                  Custom Tags{' '}
                  <EllipsisButtonWrapper>
                    <Ellipsis className="h-4 w-4" />
                  </EllipsisButtonWrapper>
                </SubHeading>
              </EditTripTags>
              <SidebarItem>
                <div className="flex flex-wrap items-center gap-2">
                  {onlyCustomTags.length > 0 ? (
                    onlyCustomTags.map((tag: string) => (
                      <Badge
                        key={`${tag}tag`}
                        variant="secondary"
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className={cn(
                            'inline-block h-2 w-2 shrink-0 rounded-full',
                            getTagDotClass(tag, colorMap)
                          )}
                        />
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-xs italic">No Custom Tags added</p>
                  )}
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

          {user && !user.isAnonymous && (
            <>
              <Separator className="my-4" />
              <div className="px-3 pb-2">
                <TripSettings trip={trip} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default TripDetailsSidebar
