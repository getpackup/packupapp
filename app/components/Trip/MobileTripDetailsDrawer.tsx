import { BadgeInfo } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '~/components/ui/drawer'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import TripDetailsSidebar from './TripDetailsSidebar'

interface MobileTripDetailsDrawerProps {
  trip: Trip
  users: User[] | undefined
}

export default function MobileTripDetailsDrawer({
  trip,
  users,
}: MobileTripDetailsDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <BadgeInfo className="size-5" />
          <span className="sr-only">Trip Details</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{trip.name}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto">
          <TripDetailsSidebar trip={trip} users={users} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
