import { format } from 'date-fns'

import { getTagDotClass } from '~/lib/tagColors'
import { cn } from '~/lib/utils'

type ShoppingListTripPillProps = {
  tripId: string
  tripName: string
  startDate: number
  isPast: boolean
}

function ShoppingListTripPill({ tripId, tripName, startDate, isPast }: ShoppingListTripPillProps) {
  const dotClass = getTagDotClass(tripId)
  const formattedDate = format(new Date(startDate), 'MMM d')

  const pillClass = cn(
    'border-border/50 flex shrink-0 items-center gap-1 overflow-hidden rounded-full border bg-gray-100 px-2 py-0.5 text-xs font-medium select-none dark:bg-gray-800',
    isPast && 'opacity-50'
  )

  return (
    <div className="hidden max-w-[initial] min-w-fit shrink-[1.5] grow items-center gap-1 overflow-hidden transition-[flex-shrink] duration-300 hover:shrink-[0.3] lg:flex">
      <div className="flex min-w-0 grow" />
      <div className="flex min-w-0">
        <div className={pillClass}>
          <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', dotClass)} />
          <span className="text-muted-foreground max-w-32 truncate">{tripName}</span>
        </div>
      </div>
      <div className="flex min-w-0 shrink-[1e-06]">
        <div className={pillClass}>
          <span className="text-muted-foreground">{formattedDate}</span>
        </div>
      </div>
    </div>
  )
}

export default ShoppingListTripPill
