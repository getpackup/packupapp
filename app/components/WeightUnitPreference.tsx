import { ChevronDown } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import useAuth from '~/contexts/auth/useAuth'
import { useUpdateUser } from '~/services/users'
import type { WeightUnitPreferenceType } from '~/types/User'

type WeightUnitPreferenceProps = {}

const options: { label: string; value: WeightUnitPreferenceType }[] = [
  { label: 'Grams (g)', value: 'g' },
  { label: 'Kilograms (kg)', value: 'kg' },
  { label: 'Ounces (oz)', value: 'oz' },
  { label: 'Pounds (lb)', value: 'lb' },
]

const WeightUnitPreference = ({}: WeightUnitPreferenceProps) => {
  const { user } = useAuth()
  const { mutateAsync: updateUserAsync } = useUpdateUser(user?.uid ?? '')

  const handleChange = async (unit: WeightUnitPreferenceType) => {
    await updateUserAsync({
      data: {
        preferences: {
          weightUnit: unit,
        },
      },
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            {user?.preferences?.weightUnit
              ? options.find((option) => option.value === user.preferences?.weightUnit)?.label
              : 'None set'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Weight Unit</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map((option) => (
            <DropdownMenuItem key={option.value} onClick={() => handleChange(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export default WeightUnitPreference
