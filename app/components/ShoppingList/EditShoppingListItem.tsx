import { zodResolver } from '@hookform/resolvers/zod'
import { DollarSign, Loader2, Minus, Plus, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import {
  formatMoneyForInput,
  formatMoneyWithCommas,
  isValidMoney,
  parseMoneyInput,
} from '~/lib/money'
import { useUpdateShoppingListItem } from '~/services/shoppingList'
import type { ShoppingListItemType } from '~/types/ShoppingListItemType'

import InputCharacterCount from '../InputCharacterCount'
import PriorityIcon from '../PriorityIcon'
import { Badge } from '../ui/badge'
import { DropdownMenuItem } from '../ui/dropdown-menu'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type EditShoppingListItemProps = {
  item: ShoppingListItemType
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
}

const MAX_NAME_AND_NOTES_LENGTH = 100
const MAX_STORE_LENGTH = 30

const EditShoppingListItem = ({ item, isEditing, setIsEditing }: EditShoppingListItemProps) => {
  const { mutateAsync: updateShoppingListItemAsync, isPending } = useUpdateShoppingListItem()
  const [focusedPriceField, setFocusedPriceField] = useState<string | null>(null)

  const formSchema = z.object({
    itemName: z
      .string()
      .min(3, 'Item name must be at least 3 characters')
      .max(
        MAX_NAME_AND_NOTES_LENGTH,
        `Item name must be less than ${MAX_NAME_AND_NOTES_LENGTH} characters`
      ),
    store: z
      .string()
      .max(MAX_STORE_LENGTH, `Store must be less than ${MAX_STORE_LENGTH} characters`)
      .optional(),
    notes: z
      .string()
      .max(
        MAX_NAME_AND_NOTES_LENGTH,
        `Notes must be less than ${MAX_NAME_AND_NOTES_LENGTH} characters`
      )
      .optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    estimatedPrice: z
      .string()
      .optional()
      .refine((val) => !val || isValidMoney(val), {
        message: 'Please enter a valid price',
      }),
    actualPrice: z
      .string()
      .optional()
      .refine((val) => !val || isValidMoney(val), {
        message: 'Please enter a valid price',
      }),
    priority: z.enum(['no priority', 'low', 'medium', 'high']),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      itemName: item.itemName,
      store: item.store ?? '',
      notes: item.notes ?? '',
      quantity: item.quantity,
      estimatedPrice: item.estimatedPrice ?? '',
      actualPrice: item.actualPrice ?? '',
      priority: item.priority,
    },
  })

  const watchedName = form.watch('itemName')
  const watchedStore = form.watch('store')
  const watchedQuantity = form.watch('quantity')
  const watchedNotes = form.watch('notes')

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!item.id) return

    // Parse money values to normalized strings before saving
    const normalizedValues = {
      ...values,
      estimatedPrice: values.estimatedPrice ? parseMoneyInput(values.estimatedPrice) || null : null,
      actualPrice: values.actualPrice ? parseMoneyInput(values.actualPrice) || null : null,
    }

    await updateShoppingListItemAsync({ data: { id: item.id, ...normalizedValues } }).then(() => {
      form.reset(values)
      // fake esc key press to close the sheet
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
  }

  return (
    <Sheet open={isEditing} onOpenChange={setIsEditing}>
      <SheetTrigger
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsEditing(true)
        }}
        asChild
      >
        <DropdownMenuItem>
          <Settings />
          Edit
        </DropdownMenuItem>
      </SheetTrigger>
      <SheetContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader className="border-b">
              <SheetTitle>Edit shopping list item</SheetTitle>
              <SheetDescription>
                Make changes to the shopping list item here. Click save when you&apos;re done.
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-6 overflow-y-auto p-4">
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Item name"
                        {...field}
                        maxLength={MAX_NAME_AND_NOTES_LENGTH}
                      />
                    </FormControl>
                    <FormMessage />
                    <InputCharacterCount
                      maxLength={MAX_NAME_AND_NOTES_LENGTH}
                      value={watchedName ?? ''}
                      dangerThreshold={20}
                      isDirty={Boolean(form.formState.dirtyFields.itemName)}
                    />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={watchedQuantity === 1}
                  onClick={(e) => {
                    e.stopPropagation()
                    form.setValue('quantity', watchedQuantity - 1)
                  }}
                >
                  <Minus />
                </Button>
                <span className="flex items-center gap-2">
                  Quantity:
                  <Badge
                    className="h-5 min-w-5 rounded-full font-mono tabular-nums"
                    variant="default"
                  >
                    <X className="h-3 w-3" /> {watchedQuantity}
                  </Badge>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    form.setValue('quantity', form.getValues('quantity') + 1)
                  }}
                >
                  <Plus />
                </Button>
              </div>
              <FormField
                control={form.control}
                name="store"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="REI, MEC, Target, etc."
                        {...field}
                        maxLength={MAX_STORE_LENGTH}
                      />
                    </FormControl>
                    <FormMessage />
                    <InputCharacterCount
                      maxLength={MAX_STORE_LENGTH}
                      value={watchedStore ?? ''}
                      dangerThreshold={5}
                      isDirty={Boolean(form.formState.dirtyFields.store)}
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={MAX_NAME_AND_NOTES_LENGTH} />
                    </FormControl>
                    <FormMessage />
                    <InputCharacterCount
                      maxLength={MAX_NAME_AND_NOTES_LENGTH}
                      value={watchedNotes ?? ''}
                      dangerThreshold={20}
                      isDirty={Boolean(form.formState.dirtyFields.notes)}
                    />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedPrice"
                  render={({ field }) => {
                    const isFocused = focusedPriceField === 'estimatedPrice'
                    const displayValue =
                      field.value && !isFocused
                        ? formatMoneyWithCommas(field.value)
                        : (field.value ?? '')

                    return (
                      <FormItem>
                        <FormLabel>Estimated price</FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupInput
                              type="text"
                              placeholder="0.00"
                              value={displayValue}
                              onChange={(e) => {
                                const formatted = formatMoneyForInput(e.target.value)
                                field.onChange(formatted)
                              }}
                              onBlur={(e) => {
                                setFocusedPriceField(null)
                                const parsed = parseMoneyInput(e.target.value)
                                const normalized = parsed || ''
                                field.onChange(normalized)
                              }}
                              onFocus={() => {
                                setFocusedPriceField('estimatedPrice')
                              }}
                            />
                            <InputGroupAddon>
                              <DollarSign />
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <FormField
                  control={form.control}
                  name="actualPrice"
                  render={({ field }) => {
                    const isFocused = focusedPriceField === 'actualPrice'
                    const displayValue =
                      field.value && !isFocused
                        ? formatMoneyWithCommas(field.value)
                        : (field.value ?? '')

                    return (
                      <FormItem>
                        <FormLabel>Actual price</FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupInput
                              type="text"
                              placeholder="0.00"
                              value={displayValue}
                              onChange={(e) => {
                                const formatted = formatMoneyForInput(e.target.value)
                                field.onChange(formatted)
                              }}
                              onBlur={(e) => {
                                setFocusedPriceField(null)
                                const parsed = parseMoneyInput(e.target.value)
                                const normalized = parsed || ''
                                field.onChange(normalized)
                              }}
                              onFocus={() => {
                                setFocusedPriceField('actualPrice')
                              }}
                            />
                            <InputGroupAddon>
                              <DollarSign />
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no priority">
                            <PriorityIcon priority="no priority" />
                            No priority
                          </SelectItem>
                          <SelectItem value="low">
                            <PriorityIcon priority="low" withColor />
                            Low
                          </SelectItem>
                          <SelectItem value="medium">
                            <PriorityIcon priority="medium" withColor />
                            Medium
                          </SelectItem>
                          <SelectItem value="high">
                            <PriorityIcon priority="high" withColor />
                            High
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="space-y-2 border-t p-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default EditShoppingListItem
