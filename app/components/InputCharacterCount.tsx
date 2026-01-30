import { cn } from '~/lib/utils'

import { FormDescription } from './ui/form'

type InputCharacterCountProps = {
  maxLength: number
  value: string
  dangerThreshold: number
  isDirty: boolean
}

const InputCharacterCount = ({
  maxLength,
  value,
  dangerThreshold,
  isDirty,
}: InputCharacterCountProps) => {
  const valueLength = value?.length ?? 0
  const remainingCharacters = maxLength - valueLength

  if (maxLength - dangerThreshold <= remainingCharacters || !isDirty) {
    return null
  }

  return (
    <FormDescription
      className={cn('text-xs', {
        'text-destructive': maxLength - dangerThreshold - valueLength <= 0,
      })}
    >
      {remainingCharacters === 1
        ? `${remainingCharacters} character remaining`
        : `${remainingCharacters} characters remaining`}
    </FormDescription>
  )
}

export default InputCharacterCount
