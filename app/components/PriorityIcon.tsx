import { cn } from '~/lib/utils'
import type { ShoppingListItemPriority } from '~/types/ShoppingListItemType'

type PriorityIconProps = {
  priority: ShoppingListItemPriority
  withColor?: boolean
}

const PriorityIcon = ({ priority, withColor = false }: PriorityIconProps) => {
  const isLow = priority === 'low'
  const isMedium = priority === 'medium'
  const isNoPriority = priority === 'no priority'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={cn('', {
        currentColor: !withColor || priority === 'no priority',
        '#991b1b': withColor && priority === 'high',
        '#b45309': withColor && priority === 'medium',
        '#facc15': withColor && priority === 'low',
      })}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 21v-6" className={cn(isNoPriority && 'opacity-50')} />
      <path d="M12 21V9" className={cn((isNoPriority || isLow) && 'opacity-50')} />
      <path d="M19 21V3" className={cn((isNoPriority || isLow || isMedium) && 'opacity-50')} />
    </svg>
  )
}

export default PriorityIcon
