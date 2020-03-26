import * as React from 'react'

type QueryResults<T> = {
  status: 'success' | 'loading' | 'error' | 'none'
  data: T | null
  error: Error | null
  refresh: () => void
}

const createDefaultCache = () => new Map()

export const isServer = () => typeof window === 'undefined'

export const CacheContext = React.createContext({
  cache: createDefaultCache(),
  promises: new Map(),
})

export const CacheContextProvider = ({
  children,
  cache = createDefaultCache(),
  promises = new Map(),
}: {
  children: React.ReactNode
  cache?: Map<string, any>
  promises?: Map<string, Promise<any>>
}) => {
  const value = React.useMemo(
    () => ({
      cache,
      // In right now to allow some intelligent batching / SSR in the future
      // TODO: will need to make promises injectable so that we can flush out all
      // the active promises during SSR
      promises,
      // TODO: do we need to store errors here?
      // errors: new Map()
    }),
    [cache]
  )

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>
}

export const useCache = () => {
  const ctx = React.useContext(CacheContext)
  return ctx
}

type Action<T extends unknown> =
  | { type: 'initiateRequest' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: Error }

type State<T> = Pick<QueryResults<T>, 'status' | 'data' | 'error'>

export const useQuery = <T extends unknown>(
  cacheKey: string,
  fetcher: () => Promise<T>
): QueryResults<T> => {
  const { cache, promises } = useCache()
  const collectedPromise = React.useRef<boolean>(false)

  const [state, dispatch] = React.useReducer(
    (prevState: State<T>, action: Action<T>): State<T> => {
      switch (action.type) {
        case 'initiateRequest':
          return { ...prevState, status: 'loading', data: null }
        case 'success':
          return {
            ...prevState,
            status: 'success',
            data: action.data,
            error: null,
          }
        case 'error':
          return {
            ...prevState,
            status: 'error',
            data: null,
            error: action.error,
          }
        default:
          throw new Error('Invalid reducer key!')
      }
    },
    cache.has(cacheKey)
      ? {
          status: 'success',
          data: cache.get(cacheKey),
          error: null,
        }
      : {
          status: 'none',
          data: null,
          error: null,
        }
  )

  const fetchData = React.useCallback(async () => {
    dispatch({ type: 'initiateRequest' })

    try {
      const promise = fetcher()
      promises.set(cacheKey, promise)

      const data = await promise

      cache.set(cacheKey, data)
      promises.delete(cacheKey)

      dispatch({ type: 'success', data })
      return data
    } catch (error) {
      promises.delete(cacheKey)
      dispatch({ type: 'error', error })
      return null
    }
  }, [fetcher, cacheKey, cache])

  React.useEffect(() => {
    // If the data already exists in the cache, then just set it immediately.
    if (cache.has(cacheKey)) {
      return dispatch({ type: 'success', data: cache.get(cacheKey) })
    }

    // If the request is already running from another component, just wait for
    // it to resolve and dispatch the event.
    if (promises.has(cacheKey)) {
      dispatch({ type: 'initiateRequest' })

      promises
        .get(cacheKey)
        .then((data: T) => {
          dispatch({ type: 'success', data })
        })
        .catch((error: Error) => dispatch({ type: 'error', error }))
      return
    }

    // TODO: if an error, will this cause infinite refetches?

    fetchData()

    // TODO: cancel promise on unmount
  }, [cacheKey, cache, promises, fetchData])

  if (isServer() && !collectedPromise.current) {
    collectedPromise.current = true
    promises.set(cacheKey, fetcher())
  }

  return {
    refresh: fetchData,
    ...state,
  }
}
