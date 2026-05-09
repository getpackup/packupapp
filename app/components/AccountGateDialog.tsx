import { UserPlus } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface AccountGateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

export function AccountGateDialog({ open, onOpenChange, message }: AccountGateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{message}</DialogTitle>
          <DialogDescription>
            Keep your trips, invite friends, and access your data from any device.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="accent" size="lg" asChild>
            <Link to="/signup">
              <UserPlus className="size-4" />
              Create account
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
