import { useQueryClient } from '@tanstack/react-query'
import { limit, Timestamp, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'

import useAuth from '~/contexts/auth/useAuth'
import { AnalyticsEvent, trackBrowserEvent } from '~/lib/analytics'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useCreateShoppingListItem } from '~/services/shoppingList'
import { tripKeys } from '~/services/tripKeys'
import { useDeletePackingListItem, useUpdatePackingListItem } from '~/services/trips'
import { type PackedByUserType, type PackingListItem } from '~/types/PackingListItem'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

export function usePackingListItem(item: PackingListItem, tripId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAnonymous = useIsAnonymous()

  const trip = queryClient.getQueryData<Trip>(tripKeys.byId(tripId))

  const constraints = useMemo(
    () =>
      trip?.tripMembers && Object.keys(trip.tripMembers).length > 0
        ? [where('uid', 'in', Object.keys(trip.tripMembers)), limit(10)]
        : [],
    [trip?.tripMembers]
  )

  const users = queryClient.getQueryData<User[]>(tripKeys.members(tripId, constraints)) ?? []

  const { mutateAsync: updatePackingListItemAsync } = useUpdatePackingListItem({ tripId })
  const { mutateAsync: deletePackingListItemAsync } = useDeletePackingListItem()
  const { mutateAsync: createShoppingListItemAsync } = useCreateShoppingListItem()

  const [showAccountGate, setShowAccountGate] = useState(false)

  const togglePacked = () => {
    if (!item.id) return
    const packing = !item.isPacked
    updatePackingListItemAsync({ data: { id: item.id, isPacked: packing } })
    if (packing && user?.uid) {
      trackBrowserEvent(AnalyticsEvent.PackingListItemPacked, user.uid, {
        source: 'browser',
        trip_id: tripId,
        item_id: item.id,
        is_group_item: item.packedBy[0]?.isShared ?? false,
      })
    }
  }

  const handleQuantityChange = (change: number) => {
    if (!item.id) return
    const newQuantity = item.quantity + change
    if (newQuantity < 1) return
    updatePackingListItemAsync({ data: { id: item.id, quantity: newQuantity } })
  }

  const handleMoveToOrFromGroupItems = () => {
    if (!item.id || !user) return
    const isAlreadyShared = item.packedBy[0].isShared
    updatePackingListItemAsync({
      data: { id: item.id, packedBy: [{ uid: user.uid, quantity: 1, isShared: !isAlreadyShared }] },
    })
  }

  const handleToggleAssignee = (uid: string) => {
    if (!item.id) return
    const isAssigned = item.packedBy.some((p) => p.uid === uid)
    let newPackedBy: PackedByUserType[]

    if (isAssigned) {
      newPackedBy = item.packedBy.filter((p) => p.uid !== uid)
      if (newPackedBy.length === 0) return
    } else {
      newPackedBy = [...item.packedBy, { uid, quantity: 1, isShared: true }]
    }

    updatePackingListItemAsync({ data: { id: item.id, packedBy: newPackedBy } })
  }

  const handleDelete = () => {
    if (!item.id) return
    deletePackingListItemAsync({ tripId, packingListItemId: item.id })
  }

  const handleSendToShoppingList = () => {
    if (isAnonymous) {
      setShowAccountGate(true)
      return
    }

    if (!item.id || !trip || !user) return

    createShoppingListItemAsync({
      data: {
        actualPrice: null,
        created: Timestamp.now(),
        estimatedPrice: null,
        isPurchased: false,
        itemName: item.name,
        notes: '',
        priority: 'no priority',
        purchasedAt: null,
        quantity: item.quantity,
        sourcePackingListItemId: item.id,
        store: null,
        tripId: trip.tripId,
        updated: null,
        userId: user.uid,
      },
    })
  }

  return {
    trip,
    users,
    constraints,
    togglePacked,
    handleQuantityChange,
    handleMoveToOrFromGroupItems,
    handleToggleAssignee,
    handleDelete,
    handleSendToShoppingList,
    showAccountGate,
    setShowAccountGate,
  }
}
