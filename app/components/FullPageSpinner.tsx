import { Loader2 } from 'lucide-react'

type FullPageSpinnerProps = {
  what?: string
}

const FullPageSpinner = ({ what }: FullPageSpinnerProps) => {
  return (
    <div className="grid h-full min-h-screen place-items-center">
      <div className="flex items-center gap-2">
        <Loader2 className="size-8 animate-spin" /> Loading {what ? what : ''}...
      </div>
    </div>
  )
}

export default FullPageSpinner
