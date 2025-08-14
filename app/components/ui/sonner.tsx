import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group [&>li]:!items-start"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--error-bg': 'var(--sonner-error-bg)',
          '--error-text': 'var(--sonner-error-text)',
          '--error-border': 'var(--sonner-error-border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
