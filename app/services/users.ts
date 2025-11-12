import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, type QueryConstraint, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'

import { firestoreDb } from '~/firebase/config'
import type { User } from '~/types/User'

const userRootKey = ['users'] as const

export const userKeys = {
  root: userRootKey,
  all: (constraints: QueryConstraint[]) => [...userRootKey, ...constraints] as const,
  byId: (userId: string) => [...userRootKey, userId] as const,
}

export function useUserByIdQuery({ userId }: { userId: string }) {
  return useQuery<User, Error>({
    queryKey: userKeys.byId(userId),
    queryFn: async () => {
      const docRef = doc(firestoreDb, 'users', userId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Trip does not exist')
      }

      return { uid: docSnap.id, ...docSnap.data() } as User
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient()
  const userQueryKey = userKeys.byId(userId)

  return useMutation({
    mutationFn: async ({ data }: { data: Partial<User> }) => {
      const docRef = doc(firestoreDb, 'users', userId)
      const updateTimestamp = Timestamp.fromDate(new Date())
      const updateData = { ...data, updated: updateTimestamp }

      await updateDoc(docRef, updateData)
      return { ...updateData, uid: userId }
    },
    onMutate: async ({ data }) => {
      await queryClient.cancelQueries({ queryKey: userQueryKey })

      const previousData = queryClient.getQueryData(userQueryKey)

      // Optimistically update to the new value
      const updateTimestamp = Timestamp.fromDate(new Date())
      queryClient.setQueryData(userQueryKey, (old: User | undefined) => ({
        ...(old ?? { uid: userId }),
        ...data,
        updated: updateTimestamp,
      }))

      return { previousData }
    },
    onSuccess: () => {
      toast.success(`User updated successfully`)
      // trackEvent('User Updated Successfully', {
      //   userId: userId,
      //   ...previousUserData,
      //   ...data,
      // })
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(userQueryKey, context.previousData)
      }
      toast.error(err.message)
      // trackEvent(`User Update Failure`, {
      // userId: userId,
      //   ...previousUserData,
      // error: err,
      // })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey })
    },
  })
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async (user: User) => {
      const docRef = doc(firestoreDb, 'users', user.uid)
      await setDoc(docRef, { ...user })
      return { ...user }
    },
  })
}
