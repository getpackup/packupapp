import useAuth from '~/contexts/auth/useAuth'
import { getItemTags } from '~/lib/getItemTags'
import { getTagDotClass } from '~/lib/tagColors'
import { useCustomTagColorMap } from '~/lib/useCustomTagColorMap'
import { cn } from '~/lib/utils'

type TagPillsProps = {
  item: { tags?: string[]; category?: string }
}

function TagPills({ item }: TagPillsProps) {
  const { user } = useAuth()
  const colorMap = useCustomTagColorMap(user?.uid ?? '')
  const tags = getItemTags(item)

  if (tags.length === 0) return null

  return (
    <div className="group/tags scrollbar-none flex min-w-0 items-center overflow-x-auto">
      <div className="flex items-center transition-all duration-200 ease-out group-hover/tags:gap-2">
        {tags.map((tag, index) => (
          <div
            key={tag}
            className={cn(
              'border-border/50 relative flex h-6 items-center rounded-full border bg-gray-100 px-2 text-[11px] font-medium whitespace-nowrap transition-all duration-200 ease-out select-none dark:bg-gray-800',
              index > 0 && '-ml-2 group-hover/tags:ml-0'
            )}
            style={{ zIndex: index }}
          >
            <span
              className={cn(
                'inline-block h-2 w-2 shrink-0 rounded-full',
                getTagDotClass(tag, colorMap)
              )}
            />
            <span
              className={cn(
                'max-w-0 overflow-hidden transition-all duration-200 ease-out group-hover/tags:ml-1.5 group-hover/tags:max-w-32',
                index === 0 && 'ml-1.5 max-w-32'
              )}
            >
              {tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TagPills
