import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAuth } from '~/contexts/auth/useAuth'
import { useScreenSize } from '~/lib/use-screen-size'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useUpdateUser } from '~/services/users'

import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer'
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

const MAX_CONTACTS = 5

function ContactFormFields({
  register,
  errors,
}: {
  register: UseFormRegister<EmergencyContactFormValues>
  errors: FieldErrors<EmergencyContactFormValues>
}) {
  return (
    <>
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
    </>
  )
}

export function EmergencyContacts() {
  const isAnonymous = useIsAnonymous()
  const { user } = useAuth()
  const { mutateAsync: updateUserAsync } = useUpdateUser(user?.uid ?? '')
  const { isMediumBreakpoint } = useScreenSize()
  const [formOpen, setFormOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

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
    closeForm()
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingIndex(null)
    reset(EMPTY_CONTACT)
  }

  const handleConfirmDelete = async () => {
    if (deletingIndex === null) return
    const updated = contacts.filter((_, i) => i !== deletingIndex)
    await updateUserAsync({ data: { emergencyContacts: updated } })
    setDeletingIndex(null)
  }

  const handleEdit = (index: number) => {
    reset(contacts[index])
    setEditingIndex(index)
    setFormOpen(true)
  }

  const handleAdd = () => {
    reset(EMPTY_CONTACT)
    setEditingIndex(null)
    setFormOpen(true)
  }

  const formTitle = editingIndex !== null ? 'Edit contact' : 'Add emergency contact'
  const deleteContactName = deletingIndex !== null ? contacts[deletingIndex]?.name : null

  return (
    <div className="space-y-4">
      <h3 className="mb-2 text-lg font-bold">Emergency Contacts</h3>
      {isAnonymous ? (
        <UpgradeAccountGate message="Create an account to manage your emergency contacts.">
          <div />
        </UpgradeAccountGate>
      ) : (
        <>
          <div className="divide-border divide-y">
            {contacts.map((contact, index) => (
              <div
                key={index}
                data-testid="emergency-contact"
                className="flex items-center justify-between py-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-muted-foreground text-sm">{contact.phoneNumber}</p>
                  {contact.email && (
                    <p className="text-muted-foreground text-sm">{contact.email}</p>
                  )}
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
                    onClick={() => setDeletingIndex(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {contacts.length < MAX_CONTACTS && (
            <Button variant="outline" onClick={handleAdd}>
              <Plus className="size-4" />
              Add emergency contact
            </Button>
          )}
          {isMediumBreakpoint ? (
            <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{formTitle}</DialogTitle>
                  <DialogDescription></DialogDescription>
                </DialogHeader>
                <form
                  id="ec-form"
                  noValidate
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-3"
                >
                  <ContactFormFields register={register} errors={errors} />
                </form>
                <DialogFooter>
                  <Button variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" form="ec-form">
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer open={formOpen} onOpenChange={(open) => !open && closeForm()}>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{formTitle}</DrawerTitle>
                  <DrawerDescription></DrawerDescription>
                </DrawerHeader>
                <form
                  id="ec-form"
                  noValidate
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-3 px-4"
                >
                  <ContactFormFields register={register} errors={errors} />
                </form>
                <DrawerFooter>
                  <Button type="submit" form="ec-form">
                    Save
                  </Button>
                  <Button variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}

          {isMediumBreakpoint ? (
            <Dialog
              open={deletingIndex !== null}
              onOpenChange={(open) => !open && setDeletingIndex(null)}
            >
              <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Delete contact</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground text-sm">
                  Are you sure you want to delete
                  {deleteContactName ? ` ${deleteContactName}` : ' this contact'} as an Emergency
                  Contact? This action cannot be undone.
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeletingIndex(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleConfirmDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer
              open={deletingIndex !== null}
              onOpenChange={(open) => !open && setDeletingIndex(null)}
            >
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Delete contact</DrawerTitle>
                </DrawerHeader>
                <p className="text-muted-foreground px-4 text-sm">
                  Are you sure you want to delete
                  {deleteContactName ? ` ${deleteContactName}` : ' this contact'}?
                </p>
                <DrawerFooter>
                  <Button variant="destructive" onClick={handleConfirmDelete}>
                    Delete
                  </Button>
                  <Button variant="outline" onClick={() => setDeletingIndex(null)}>
                    Cancel
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
        </>
      )}
    </div>
  )
}
