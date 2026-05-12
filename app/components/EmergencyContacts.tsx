import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAuth } from '~/contexts/auth/useAuth'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useUpdateUser } from '~/services/users'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { UpgradeAccountGate } from './UpgradeAccountGate'

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z
    .string()
    .refine((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Invalid email'),
})

type EmergencyContactFormValues = z.infer<typeof emergencyContactSchema>

const EMPTY_CONTACT: EmergencyContactFormValues = { name: '', phoneNumber: '', email: '' }

const MAX_CONTACTS = 3

export function EmergencyContacts() {
  const isAnonymous = useIsAnonymous()
  const { user } = useAuth()
  const { mutateAsync: updateUserAsync } = useUpdateUser(user?.uid ?? '')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const contacts = user?.emergencyContacts ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: EMPTY_CONTACT,
  })

  const onSubmit = async (values: EmergencyContactFormValues) => {
    const updated = [...contacts]
    if (editingIndex !== null) {
      updated[editingIndex] = values
    } else {
      updated.push(values)
    }
    await updateUserAsync({ data: { emergencyContacts: updated } })
    setIsAdding(false)
    setEditingIndex(null)
    reset(EMPTY_CONTACT)
  }

  const handleDelete = async (index: number) => {
    const updated = contacts.filter((_, i) => i !== index)
    await updateUserAsync({ data: { emergencyContacts: updated } })
  }

  const handleEdit = (index: number) => {
    const contact = contacts[index]
    reset(contact)
    setEditingIndex(index)
    setIsAdding(true)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingIndex(null)
    reset(EMPTY_CONTACT)
  }

  if (isAnonymous) {
    return (
      <UpgradeAccountGate message="Create an account to manage your emergency contacts.">
        <div />
      </UpgradeAccountGate>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="mb-2 text-lg font-bold">Emergency Contacts</h3>

      {contacts.map((contact, index) => (
        <div
          key={index}
          data-testid="emergency-contact"
          className="flex items-center justify-between rounded-md border p-3"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">{contact.name}</p>
            <p className="text-muted-foreground text-sm">{contact.phoneNumber}</p>
            {contact.email && <p className="text-muted-foreground text-sm">{contact.email}</p>}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit"
              onClick={() => handleEdit(index)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete"
              onClick={() => handleDelete(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      {isAdding ? (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ec-name">Name</Label>
            <Input id="ec-name" {...register('name')} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ec-phone">Phone number</Label>
            <Input id="ec-phone" type="tel" {...register('phoneNumber')} />
            {errors.phoneNumber && (
              <p className="text-destructive text-sm">{errors.phoneNumber.message}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ec-email">Email</Label>
            <Input id="ec-email" type="email" {...register('email')} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        contacts.length < MAX_CONTACTS && (
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="size-4" />
            Add emergency contact
          </Button>
        )
      )}
    </div>
  )
}
