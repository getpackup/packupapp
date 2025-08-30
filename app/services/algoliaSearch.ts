import { algoliasearch } from 'algoliasearch'

let algoliaClient: any = null

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
  search(requests: any) {
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
            },
          ],
        })
      }

      if (requests.every((request: any) => !request.query)) {
        console.warn('No query provided in requests, returning empty results')
        return Promise.resolve({
          results: requests.map(() => ({
            hits: [],
            nbHits: 0,
            nbPages: 0,
            processingTimeMS: 0,
          })),
        })
      }

      // Apply global search options and fix request structure
      const modifiedRequests = requests.map((request: any) => ({
        indexName: request.indexName,
        query: request.query,
        params: {
          restrictSearchableAttributes: ['username'],
          typoTolerance: false,
          ...request.params,
        },
      }))

      return client.search(modifiedRequests)
    } catch (error) {
      console.error('Algolia search error:', error)
      throw error
    }
  },
}

export default algoliaSearch
