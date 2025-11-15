import { cn } from '~/lib/utils'

import { FormDescription } from './ui/form'

type InputCharacterCountProps = {
  maxLength: number
  value: string
  dangerThreshold: number
}

const InputCharacterCount = ({ maxLength, value, dangerThreshold }: InputCharacterCountProps) => {
  const remainingCharacters = maxLength - (value?.length ?? 0)

  if (remainingCharacters < 0) {
    return null
  }

  return (
    <FormDescription
      className={cn('text-xs', {
        'text-destructive': maxLength - dangerThreshold - (value?.length ?? 0) < 0,
      })}
    >
      {remainingCharacters === 1
        ? `${remainingCharacters} character remaining`
        : `${remainingCharacters} characters remaining`}
    </FormDescription>
  )
}

export default InputCharacterCount
