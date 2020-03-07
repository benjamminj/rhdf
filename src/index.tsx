import * as React from 'react'

type QueryResults<T> = {
  status: 'success' | 'loading' | 'error' | 'none'
  data: T | null
  error: Error | null
  refresh: () => void
}

const defaultCache = new Map()

const CacheContext = React.createContext({
  cache: defaultCache,
  promises: new Map(),
})

export const CacheContextProvider = ({
  children,
  cache = defaultCache,
}: {
  children: React.ReactNode
  cache?: Map<string, any>
}) => {
  const value = React.useMemo(
    () => ({
      cache: cache,
      // In right now to allow some intelligent batching / SSR in the future
      // TODO: will need to make promises injectable so that we can flush out all
      // the active promises during SSR
      promises: new Map(),
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
  console.info('🔍 cache >>', cache)
  const reqRef = React.useRef<string>()

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

  const fetchData = React.useCallback(() => {
    dispatch({ type: 'initiateRequest' })

    return fetcher()
      .then(data => {
        cache.set(cacheKey, data)
        // TODO: might be able to move this into the if/else branch rather than right
        // here inside the callback.
        // Then again, might be better to leave here since it's working 🤷‍♀️
        dispatch({ type: 'success', data })
        return data
      })
      .catch(error => dispatch({ type: 'error', error }))
  }, [fetcher, cacheKey, cache])

  // TODO: docz why both are needed.
  // if the data is already in the cache (i.e. injected from the server) we don't want
  // to run the request.
  // Additionally, if the request is already running we don't want to keep running it, we
  // want to wait until it resolves.
  if (promises.has(cacheKey) || cache.has(cacheKey)) {
    // TODO: docz why this is important, if we don't have this extra check inside the hook for
    // the "current req" then we will hit React with way too many updates at once.
    //
    // Normally we'd use an effect for this type of stuff, but we want to make the requests
    // work on the server so we need it to happen inside of render.
    if (reqRef.current !== cacheKey) {
      reqRef.current = cacheKey

      if (cache.has(cacheKey)) {
        dispatch({ type: 'success', data: cache.get(cacheKey) })

        // TODO: should we use a stale-while-revalidate caching strategy here?
        // we would need to fire off a new request in the background no matter whether
        // we hit the cache or not.
        //
        // Just thinking out loud, that means that _AFTER_ a request completes, we will need
        // to remove it from `promises` so that other requests know that the data is
        // no longer fetching...basically `promises` becomes a list of "in-flight" requests
        // while `cache` is a list of the data from those requests
        return {
          refresh: fetchData,
          ...state,
        }
      }

      if (promises.has(cacheKey) && !cache.has(cacheKey)) {
        dispatch({ type: 'initiateRequest' })
      }

      promises.get(cacheKey).then((data: T) => {
        console.info('💡 promises >>', promises)
        // TODO: right now when flushing the cache it seems like not everything shifts back
        // to "loading"...I think we might need to remove the promises from the state once they
        // are finished 🤔
        dispatch({ type: 'success', data })
      })
    }
  } else {
    promises.set(cacheKey, fetchData())
  }

  return {
    refresh: fetchData,
    ...state,
  }
}
