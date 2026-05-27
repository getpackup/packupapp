import { cn } from '~/lib/utils'

type PageContentProps = {
  children: React.ReactNode
  noPadding?: boolean
  className?: string
}

const PageContent = ({ children, noPadding, className }: PageContentProps) => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          'h-full min-h-0 w-full overflow-y-auto p-4 md:p-8',
          noPadding && 'p-0!',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default PageContent
