import { zodResolver } from '@hookform/resolvers/zod'
import type { SearchResponse } from 'algoliasearch'
import { Loader2, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { useAuth } from '~/contexts/auth/useAuth'
import { algoliaSearch } from '~/services/algoliaSearch'
import { useUpdateDocument } from '~/services/api'
import { type TripMember, TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import TripPartyMemberBadge from './TripPartyMemberBadge'

export function AddTripPartyMember({ tripMembers }: { tripMembers: TripMember[] }) {
  const { mutateAsync: updateDocument } = useUpdateDocument('trips')
  const { user } = useAuth()
  const { id } = useParams()

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
          console.log(hits)
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

  const formSchema = z.object({
    searchValue: z
      .string()
      .min(1, { message: 'Search value must be at least 2 characters' })
      .max(30, { message: 'Search value must be less than 30 characters' })
      .regex(/^[a-zA-Z0-9]+$/, { message: 'Search value can only contain letters and numbers' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchValue: '',
    },
  })

  const addMemberToTrip = (hitUserId: string, hitEmail: string, hitName: string) => {
    if (!user || !id) return

    const payload = {
      [`tripMembers.${hitUserId}`]: {
        uid: hitUserId,
        invitedAt: new Date(),
        status: TripMemberStatus.Pending,
        invitedBy: user.uid,
      },
    }
    updateDocument(
      { id: id, data: payload },
      {
        onSuccess: () => {
          // TODO: send trip invitation email and track events
          //   sendTripInvitationEmail({
          // tripId: id,
          // invitedBy: user.username,
          // email: hitEmail,
          // greetingName: hitName || '',
          //         })

          // trackEvent('Trip Party Search User Added', {
          //   tripId: id,
          //   ...payload,
          // })

          toast.success(`${hitName} has been invited to the trip`)
        },
        onError: (err: Error) => {
          // trackEvent(`Trip Party Member Add Failure`, {
          //   ...payload,
          // tripId: id,
          // error: err,
          // })
          toast.error(err.message)
        },
      }
    )
  }

  return (
    <Popover>
      <PopoverTrigger>
        <>
          <Plus className="size-4" />
          <span className="sr-only">Add member</span>
        </>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Form {...form}>
          <form className="space-y-8">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="searchValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add trip party member</FormLabel>
                    <FormControl>
                      <Input
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
                        form.getValues('searchValue') !== '' &&
                        form.getValues('searchValue').length >= 2 &&
                        hits &&
                        hits.length === 0 && (
                          <span>
                            No results found.{' '}
                            <span
                              className="text-primary cursor-pointer"
                              onClick={() => form.reset()}
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
                  hits.map((hit) => {
                    const matchingUser = tripMembers.find((member) => member.uid === hit.uid)
                    return (
                      <div
                        key={hit.objectID}
                        className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage
                              src={hit.photoURL}
                              alt={`${hit.username.toLocaleLowerCase()} avatar`}
                              gravatarEmail={hit.email}
                            />
                            <AvatarFallback>{hit.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-medium">{hit.displayName}</span>
                              <span className="text-muted-foreground truncate text-xs">
                                @{hit.username.toLocaleLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {matchingUser ? (
                          <TripPartyMemberBadge member={matchingUser} />
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => addMemberToTrip(hit.uid, hit.email, hit.displayName)}
                          >
                            <Plus />
                            <span className="sr-only">Add {hit.displayName} to trip</span>
                          </Button>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  )
}
