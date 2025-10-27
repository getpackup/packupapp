import {
  type Algoliasearch,
  algoliasearch,
  type SearchParamsObject,
  type SearchResponses,
} from 'algoliasearch'

type SearchRequest = {
  indexName: string
  query?: string
  params?: Partial<SearchParamsObject>
}

let algoliaClient: Algoliasearch | null = null

const createClient = () => {
  if (algoliaClient) return algoliaClient

  const appId = import.meta.env.VITE_ALGOLIA_APP_ID
  const apiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY

  if (!appId || !apiKey) {
    console.error('Missing Algolia environment variables:', { appId, apiKey })
    throw new Error('Algolia configuration is missing. Please check your .env file.')
  }

  try {
    algoliaClient = algoliasearch(appId, apiKey)
    return algoliaClient
  } catch (error) {
    console.error('Failed to create Algolia client:', error)
    throw error
  }
}

export const algoliaSearch = {
  search<T = Record<string, unknown>>(requests: SearchRequest[]): Promise<SearchResponses<T>> {
    try {
      const client = createClient()

      if (!Array.isArray(requests)) {
        console.warn('Requests is not an array, returning empty results')
        return Promise.resolve({
          results: [
            {
              hits: [],
              nbHits: 0,
              nbPages: 0,
              processingTimeMS: 0,
              hitsPerPage: 0,
              page: 0,
              params: '',
              query: '',
              exhaustiveNbHits: false,
              exhaustiveFacetCount: false,
              exhaustive: { facetsCount: false, nbHits: false },
            },
          ],
        } as SearchResponses<T>)
      }

      if (requests.every((request) => !request.query)) {
        console.warn('No query provided in requests, returning empty results')
        return Promise.resolve({
          results: requests.map(() => ({
            hits: [],
            nbHits: 0,
            nbPages: 0,
            processingTimeMS: 0,
            hitsPerPage: 0,
            page: 0,
            params: '',
            query: '',
            exhaustiveNbHits: false,
            exhaustiveFacetCount: false,
            exhaustive: { facetsCount: false, nbHits: false },
          })),
        } as SearchResponses<T>)
      }

      // Apply global search options and fix request structure
      const modifiedRequests = requests.map((request) => ({
        indexName: request.indexName,
        query: request.query,
        params: {
          restrictSearchableAttributes: ['username', 'displayName', 'email'],
          typoTolerance: false,
          ...request.params,
        },
      }))

      return client.search<T>(modifiedRequests)
    } catch (error) {
      console.error('Algolia search error:', error)
      throw error
    }
  },
}

export default algoliaSearch
