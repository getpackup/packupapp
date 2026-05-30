import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import useAuth from '~/contexts/auth/useAuth'
import { getItemTags } from '~/lib/getItemTags'
import { getTagDotClass } from '~/lib/tagColors'
import { useCustomTagColorMap } from '~/lib/useCustomTagColorMap'
import { cn } from '~/lib/utils'

type TagPillsProps = {
  item: { tags?: string[]; category?: string }
}

const renderTag = (tag: string, colorMap: ReturnType<typeof useCustomTagColorMap>) => {
  return (
    <>
      <span
        className={cn('inline-block h-2 w-2 shrink-0 rounded-full', getTagDotClass(tag, colorMap))}
      />
      <span className="text-muted-foreground">{tag}</span>
    </>
  )
}

const MAX_TAGS_TO_SHOW = 3

function TagPills({ item }: TagPillsProps) {
  const { user } = useAuth()
  const colorMap = useCustomTagColorMap(user?.uid ?? '')
  const tags = getItemTags(item)
  const tagsLength = tags.length

  if (tagsLength === 0) return null

  return (
    <div className="justify-space-between shrink-1.5 hidden max-w-[initial] min-w-fit grow items-center gap-1 overflow-hidden transition-[flex-shrink] duration-300 hover:shrink-[0.3] lg:flex">
      <div className="flex min-w-0 grow"></div>
      {tags.map((tag, index) => {
        if (index === MAX_TAGS_TO_SHOW && tagsLength > MAX_TAGS_TO_SHOW) {
          return (
            <div key="more" className="flex min-w-0 shrink-[1e-06]">
              <Tooltip>
                <TooltipTrigger className="z-10 flex items-center gap-1">
                  <div className="border-border/50 flex shrink-0 items-center gap-1 overflow-hidden rounded-full border bg-gray-100 px-2 py-0.5 text-xs font-medium select-none dark:bg-gray-800">
                    <span className="text-muted-foreground">+{tagsLength - MAX_TAGS_TO_SHOW}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col items-start gap-1">
                    {tags.slice(MAX_TAGS_TO_SHOW).map((t) => (
                      <div
                        key={t}
                        className="border-border/50 relative z-10 flex shrink-0 items-center gap-1 overflow-hidden rounded-full border bg-gray-100 px-2 py-0.5 text-xs font-medium select-none dark:bg-gray-800"
                      >
                        {renderTag(t, colorMap)}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          )
        }
        if (index > MAX_TAGS_TO_SHOW - 1) {
          return null
        }
        return (
          <div key={tag} className="flex min-w-0 last:shrink-[1e-06]">
            <div className="border-border/50 flex shrink-0 items-center gap-1 overflow-hidden rounded-full border bg-gray-100 px-2 py-0.5 text-xs font-medium select-none dark:bg-gray-800">
              {renderTag(tag, colorMap)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TagPills
