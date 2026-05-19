import { UserPlus } from 'lucide-react'
import { Link } from 'react-router'

import ResponsiveDialogContainer from './ResponsiveDialogContainer'
import { Button } from './ui/button'

interface AccountGateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

export function AccountGateDialog({ open, onOpenChange, message }: AccountGateDialogProps) {
  return (
    <ResponsiveDialogContainer
      open={open}
      onOpenChange={onOpenChange}
      title={message}
      description="Keep your trips, invite friends, and access your data from any device."
      footerAction={
        <Button variant="accent" size="lg" asChild>
          <Link to="/signup">
            <UserPlus className="size-4" />
            Create account
          </Link>
        </Button>
      }
    >
      <div />
    </ResponsiveDialogContainer>
  )
}
