import { useEffect, useMemo, useRef, useState } from 'react'

import type { User } from '~/types/User'

type AlgoliaSearch = typeof import('./algoliaSearch').algoliaSearch

type UseFriendSearchParams = {
  query: string
  friends: User[]
  currentUserUid: string
}

type UseFriendSearchResult = {
  friendHits: User[]
  allUserHits: User[]
  isLoading: boolean
}

function matchesQuery(user: User, q: string): boolean {
  const lower = q.toLowerCase()
  return (
    (user.displayName?.toLowerCase().includes(lower) ?? false) ||
    (user.username?.toLowerCase().includes(lower) ?? false) ||
    (user.email?.toLowerCase().includes(lower) ?? false)
  )
}

export function useFriendSearch({
  query,
  friends,
  currentUserUid,
}: UseFriendSearchParams): UseFriendSearchResult {
  const [algoliaService, setAlgoliaService] = useState<AlgoliaSearch | null>(null)
  const [allUserHits, setAllUserHits] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const friendsRef = useRef(friends)
  friendsRef.current = friends

  const friendUidKey = useMemo(
    () =>
      friends
        .map((f) => f.uid)
        .sort()
        .join(','),
    [friends]
  )

  useEffect(() => {
    let cancelled = false
    import('./algoliaSearch')
      .then((mod) => {
        if (!cancelled) setAlgoliaService(() => mod.algoliaSearch)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const friendHits = useMemo(() => {
    const withoutSelf = friends.filter((f) => f.uid !== currentUserUid)
    if (!query) return withoutSelf
    return withoutSelf.filter((f) => matchesQuery(f, query))
  }, [friends, query, currentUserUid])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (query.length < 2) {
      setAllUserHits([])
      setIsLoading(false)
      return
    }

    if (!algoliaService) return

    setIsLoading(true)

    debounceRef.current = setTimeout(() => {
      algoliaService
        .search<User>([{ indexName: 'Users', query }])
        .then((response) => {
          const result = response.results[0]
          if ('hits' in result && result.hits) {
            const friendUids = new Set(friendsRef.current.map((f: User) => f.uid))
            setAllUserHits(
              result.hits.filter((h: User) => h.uid !== currentUserUid && !friendUids.has(h.uid))
            )
          }
        })
        .catch(() => {
          setAllUserHits([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    }, 200)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, algoliaService, friendUidKey, currentUserUid])

  return { friendHits, allUserHits, isLoading }
}
