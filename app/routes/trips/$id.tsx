import { limit, orderBy, where } from 'firebase/firestore'
import { CalendarIcon, Circle, MapPinIcon } from 'lucide-react'

import FullPageSpinner from '~/components/FullPageSpinner'
import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import StackedAvatars from '~/components/StackedAvatars'
import StaticMapImage from '~/components/StaticMapImage'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { formattedDate, formattedDateRange } from '~/lib/date'
import {
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'
import { useCollection, useDocument, useSubCollection } from '~/services/api'
import type { PackingListItem } from '~/types/PackingListItem'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import type { Route } from './+types/$id'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Trip Details | Packup' }]
}

const SubHeading = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0">
      {children}
    </div>
  )
}

export default function TripDetails({ params }: Route.ComponentProps) {
  const { id } = params

  const { data: trip } = useDocument<Trip>('trips', id)

  const constraints =
    trip?.tripMembers && Object.keys(trip.tripMembers).length > 0
      ? [where('uid', 'in', Object.keys(trip.tripMembers)), limit(6)]
      : undefined

  const { data: users } = useCollection<User[]>('users', constraints, {
    enabled: trip?.tripMembers && Object.keys(trip.tripMembers).length > 0,
    queryKey: ['firebase', 'docs', 'trips', trip?.tripId, 'tripMembers'],
  })

  const { data: packingList } = useSubCollection<PackingListItem[]>(
    'trips',
    'packing-list',
    id,
    [orderBy('category', 'asc')],
    {
      enabled: !!id && !!trip,
    }
  )

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
      <PageHeader
        crumbs={[
          { label: 'Trips', href: '/trips' },
          { label: trip?.name || 'Trip Details', href: `/trips/${id}` },
        ]}
      />
      <PageContent>
        {!trip ? (
          <FullPageSpinner what="trip details" />
        ) : (
          <div className="flex">
            <div className="w-2/3 p-8">
              <Tabs defaultValue="personal">
                <TabsList>
                  <TabsTrigger value="personal" className="px-8">
                    Personal
                  </TabsTrigger>
                  <TabsTrigger value="group" className="px-8">
                    Group
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="personal">
                  <div className="space-y-1">
                    {packingList?.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        {item.name}
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="group">group items</TabsContent>
              </Tabs>
            </div>
            <div className="border-sidebar-border w-1/3 border-l">
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
              <div className="p-4">
                <div className="space-y-2">
                  <StackedAvatars
                    tripMembers={Object.values(trip.tripMembers)}
                    users={users || []}
                  />

                  <SubHeading>Details</SubHeading>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    {formattedDateRange(trip.startDate.seconds * 1000, trip.endDate.seconds * 1000)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="h-4 w-4" />
                    {trip.startingPoint}
                  </div>
                  <Separator className="mt-4" />
                  <SubHeading>Activities</SubHeading>
                  <div className="flex flex-wrap items-center gap-2">
                    {onlyActivityTags.map((tag: string) => (
                      <Badge key={`${tag}tag`} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <SubHeading>Accommodations/Kitchen</SubHeading>
                  <div className="flex flex-wrap items-center gap-2">
                    {onlyAccommodationOrCampKitchenTags.map((tag: string) => (
                      <Badge key={`${tag}tag`} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <SubHeading>Other Considerations</SubHeading>
                  <div className="flex flex-wrap items-center gap-2">
                    {onlyOtherConsiderationsTags.map((tag: string) => (
                      <Badge key={`${tag}tag`} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                  {!!trip && !!trip.created && (
                    <div className="text-sidebar-foreground/70 ring-sidebar-border flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0">
                      Created {formattedDate(new Date(trip.created.seconds * 1000))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </>
  )
}
