import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import GearClosetItem from './GearClosetItem'
import type { GearClosetItemWithMeta } from './GearClosetList'

type GearClosetCategoryProps = {
  categoryName: string
  items: GearClosetItemWithMeta[]
  onEditItem?: (item: GearClosetItemWithMeta) => void
  onDeleteItem?: (item: GearClosetItemWithMeta) => void
}

const GearClosetCategory = ({
  categoryName,
  items,
  onEditItem,
  onDeleteItem,
}: GearClosetCategoryProps) => {
  const [accordionOpen, setAccordionOpen] = useState(true)

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full rounded-lg"
      defaultValue={categoryName}
      value={accordionOpen ? categoryName : ''}
      onValueChange={(value) => setAccordionOpen(value === categoryName)}
    >
      <AccordionItem value={categoryName}>
        <AccordionTrigger hideIcon className="group/accordion hover:no-underline" asChild>
          <div
            className="focus-visible:border-ring focus-visible:ring-ring/50 mx-2 flex w-full cursor-pointer justify-between border-b pb-2 transition-all outline-none focus-visible:ring-[3px]"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.currentTarget.click()
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="select-none">
                <div className="text-lg font-semibold">
                  {categoryName}{' '}
                  <ChevronDown className="inline h-4 w-4 transition-transform group-data-[state=closed]/accordion:-rotate-90" />
                </div>
                <div className="text-muted-foreground text-sm">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </div>
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <div className="space-y-1">
            {items.map((item) => (
              <GearClosetItem
                key={item.id}
                item={item}
                onEdit={onEditItem ? () => onEditItem(item) : undefined}
                onDelete={onDeleteItem ? () => onDeleteItem(item) : undefined}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default GearClosetCategory
