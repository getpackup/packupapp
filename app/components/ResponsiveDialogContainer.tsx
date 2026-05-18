import { useScreenSize } from '~/lib/use-screen-size'

import { Button } from './ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer'

type ResponsiveDialogContainerProps = {
  title: string
  description?: string
  children: React.ReactNode
  footerAction?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  contentProps?: React.ComponentProps<typeof DialogContent> &
    React.ComponentProps<typeof DrawerContent>
}

const ResponsiveDialogContainer = ({
  title,
  description,
  children,
  footerAction,
  onOpenChange,
  trigger,
  contentProps,
  open,
}: ResponsiveDialogContainerProps) => {
  const { isMediumBreakpoint } = useScreenSize()
  return (
    <>
      {isMediumBreakpoint ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
          <DialogContent {...contentProps}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {children}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              {footerAction}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
          <DrawerContent {...contentProps}>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            <div className="p-4">{children}</div>
            <DrawerFooter>
              {footerAction}
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}

export default ResponsiveDialogContainer
