import type { SearchResponse } from 'algoliasearch'
import { Timestamp } from 'firebase/firestore'
import { Check, Loader2, MoveRight, Plus, UserIcon, Users, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { AspectRatio } from '~/components/ui/aspect-ratio'
import { Button } from '~/components/ui/button'
import UserMediaObject from '~/components/UserMediaObject'
import useAuth from '~/contexts/auth/useAuth'
import type algoliaSearch from '~/services/algoliaSearch'
import { TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import AnimatedContainer from '../../AnimatedContainer'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form'
import { Input } from '../../ui/input'
import TripPartyMemberBadge from '../TripPartyMemberBadge'
import { newTripFormSchema } from '.'

type MembersStepProps = {
  form: UseFormReturn<z.infer<typeof newTripFormSchema>>
  setStep: (step: number) => void
  tripMembers: User[]
  setTripMembers: (members: User[]) => void
}

const MembersStep = ({ form, setStep, tripMembers, setTripMembers }: MembersStepProps) => {
  const { user } = useAuth()

  const [searchValueTimeout, setSearchValueTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isLoadingSearchResults, setIsLoadingSearchResults] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [algoliaService, setAlgoliaService] = useState<typeof algoliaSearch | null>(null)
  const [hits, setHits] = useState<SearchResponse<User>['hits']>([])

  // Prevent hydration mismatch by only allowing username checking after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    return () => {
      if (searchValueTimeout) {
        clearTimeout(searchValueTimeout)
      }
    }
  }, [searchValueTimeout])

  // Load Algolia service only on client side
  useEffect(() => {
    const loadAlgoliaService = async () => {
      try {
        const { algoliaSearch } = await import('~/services/algoliaSearch')
        setAlgoliaService(algoliaSearch)
      } catch (error) {
        console.error('Failed to load Algolia service:', error)
      }
    }

    if (isHydrated) {
      loadAlgoliaService()
    }
  }, [isHydrated])

  const findUsersBySearchValue = useCallback(
    async (searchValue: string) => {
      if (!isHydrated || !algoliaService) return

      if (searchValue.length < 2) {
        setHits([])
        setIsLoadingSearchResults(false)
        return
      }

      // Clear previous results when starting a new search
      setHits([])
      try {
        const response = await algoliaService.search<User>([
          {
            indexName: 'Users',
            query: searchValue,
          },
        ])

        const result = response.results[0]
        // Type guard to check if result is SearchResponse (has hits) not SearchForFacetValuesResponse
        if ('hits' in result) {
          const hits = result.hits

          setHits(hits)
        }
      } catch (error) {
        console.error('Error checking search value:', error)
      } finally {
        setIsLoadingSearchResults(false)
      }
    },
    [isHydrated, algoliaService]
  )

  const handleSearchValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isHydrated || !algoliaService) return

      const value = event.target.value.toLowerCase()

      if (searchValueTimeout) {
        clearTimeout(searchValueTimeout)
      }

      // If user clears the input, reset loading state
      if (value.length < 2) {
        setIsLoadingSearchResults(false)
        setHits([])
      } else {
        // Set loading state immediately when starting debounce to prevent "no results" flash
        setIsLoadingSearchResults(true)
      }

      const timeout = setTimeout(() => {
        findUsersBySearchValue(value)
      }, 200)

      setSearchValueTimeout(timeout)
    },
    [searchValueTimeout, findUsersBySearchValue, isHydrated, algoliaService]
  )

  // const sendTripMemberInvitationMessage = async (hitName: string) => {
  //   if (!user?.uid || !user?.username) return

  //   const newMessage = createSystemMessage(
  //     `@${user.username.toLowerCase()} has invited @${hitName.toLowerCase()} to the trip.`
  //   )
  //   await sendMessage({ tripId: trip.tripId, data: newMessage })
  // }

  return (
    <AnimatedContainer key="location" animation="scaleAndFadeIn">
      <span className="text-muted-foreground flex items-center gap-2 text-sm tracking-wider">
        <MoveRight className="size-4" /> About your trip
      </span>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Anyone else coming along?</h1>

        {tripMembers.length === 0 && (
          <div className="grid grid-cols-2 gap-2">
            <AspectRatio
              ratio={3 / 2}
              className="hover:bg-muted flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border p-4"
              onClick={() => setStep(3)}
            >
              <UserIcon className="size-8" />
              Nope, just me
            </AspectRatio>
            <AspectRatio
              ratio={3 / 2}
              className="hover:bg-muted flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border p-4"
              onClick={() => setTripMembers([user!])}
            >
              <Users className="size-8" />
              Add trip party members
            </AspectRatio>
          </div>
        )}

        {tripMembers.length > 0 &&
          tripMembers.map((member) => {
            return (
              <div key={member.uid} className="rounded-lg border p-2">
                <div className="flex items-center justify-between gap-2">
                  <UserMediaObject user={member} />
                  <div className="flex items-center gap-2">
                    <TripPartyMemberBadge
                      member={{
                        invitedAt: Timestamp.fromDate(new Date()),
                        status:
                          member.uid === user?.uid
                            ? TripMemberStatus.Owner
                            : TripMemberStatus.Pending,
                        uid: member.uid,
                      }}
                    />
                    {member.uid !== user?.uid && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setTripMembers(tripMembers.filter((m) => m.uid !== member.uid))
                        }
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

        {tripMembers.length > 0 && (
          <>
            <FormField
              control={form.control}
              name="memberSearchValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add trip party member</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Search by username, email, or name..."
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        handleSearchValueChange(e)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="text-center">
                    {isLoadingSearchResults && hits.length === 0 && (
                      <span>
                        <Loader2 className="mr-2 inline size-4 animate-spin" />
                        Searching...
                      </span>
                    )}
                    {!isLoadingSearchResults &&
                      form.getValues('memberSearchValue') !== '' &&
                      (form.getValues('memberSearchValue')?.length ?? 0 >= 2) &&
                      hits &&
                      hits.length === 0 && (
                        <span>
                          No results found.{' '}
                          <span
                            className="text-primary cursor-pointer"
                            onClick={() => form.setValue('memberSearchValue', '')}
                          >
                            Clear search
                          </span>
                        </span>
                      )}
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="max-h-[200px] space-y-2 overflow-y-auto">
              {hits.length > 0 &&
                hits
                  .filter((hit) => hit.uid !== user?.uid)
                  .map((hit) => {
                    return (
                      <div
                        key={hit.objectID}
                        className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors"
                      >
                        <UserMediaObject user={hit} />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setTripMembers([...tripMembers, hit])
                            form.setValue('memberSearchValue', '')
                            setHits([])
                          }}
                          disabled={tripMembers.map((member) => member.uid).includes(hit.uid)}
                        >
                          {tripMembers.map((member) => member.uid).includes(hit.uid) ? (
                            <Check />
                          ) : (
                            <Plus />
                          )}

                          <span className="sr-only">Add {hit.username} to trip</span>
                        </Button>
                      </div>
                    )
                  })}
            </div>
          </>
        )}
      </div>
    </AnimatedContainer>
  )
}

export default MembersStep
