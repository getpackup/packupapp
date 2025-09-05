import { ChevronDown, CopyCheck, Ellipsis, ListChecks, Plus, Trash2 } from 'lucide-react'

import type { PackingListItem } from '~/types/PackingListItem'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import TripPackingListItem from './TripPackingListItem'

type TripPackingListCategoryProps = {
  categoryName: string
  items: PackingListItem[]
}

const TripPackingListCategory = ({ categoryName, items }: TripPackingListCategoryProps) => {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={categoryName}>
      <AccordionItem value={categoryName}>
        <AccordionTrigger hideIcon className="group/accordion hover:no-underline" asChild>
          <div
            className="focus-visible:border-ring focus-visible:ring-ring/50 flex w-full justify-between rounded-md border-b px-3 pb-2 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.currentTarget.click()
              }
            }}
          >
            <div className="group cursor-pointer">
              <div className="text-lg font-semibold">
                {categoryName}{' '}
                <ChevronDown className="inline h-4 w-4 group-data-[state=closed]/accordion:rotate-180" />
              </div>
              <p className="text-muted-foreground text-sm">
                {items.filter((item) => item.isPacked).length} of {items.length} packed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Ellipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <CopyCheck />
                    Multi-select items
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ListChecks />
                    Toggle all packed
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Trash2 />
                    Delete all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <div className="space-y-1">
            {items.map((item) => (
              <TripPackingListItem key={item.id} item={item} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default TripPackingListCategory
