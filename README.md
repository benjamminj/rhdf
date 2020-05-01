# Rhdf — React Hooks for Data Fetching

## Roadmap

- ✅ useQuery hook that fires off request on mount
- ✅ customize the request
- ✅ use a cache, have query hook check cache
- ✅ put cache in context
- ✅ dep injection on the cache so that it can render on the server.
- ✅ make cache aware of promises being run
- ✅ Test using parallel requests to see how it handles concurrent rendering
  - This will need to make sure that the promises keep duplicate requests from firing, basically if one is in flight then set all of them to "loading"
- ✅ testing
- ✅ useMutation for "write" operations?
  - This would need to optimistically update the client side with a promise in the background that handles when it actually resolves properly.
  - This is a nice _simple_ API for local mutation https://github.com/zeit/swr#mutation-and-post-request
- ✅ ability to create a new item in the cache with `useMutation`
- ⬜️ Paginated queries
  - Some thoughts: would be cool if we could allow you to more directly affect the items in the cache, for example, having a list of items but also having each item individually cached 🤔
  - Full control of the caching might not be needed, at the very least we would want something like `fetchMore` functions on a `usePaginatedQuery` hook
  - Might be able to do the fine-grained stuff in the cache by simply using `mutate` to optimistically seed things when navigating. That way we're not preemptively seeding too many things into the cache.
- ⬜️ better types for success `data`
  - For example, have `data` not be null when `status` is `success`?
- ⬜️ suspense compatability?
  - should it be opt-in? Like a "suspense" flag either on a config ctx or in the `useQuery` hook itself.
- ⬜️ Custom caching strategies
  - The idea would be to let you customize default caching strategies or per-request strategies. For example, you might be able to set a request to revalidate on a poll interval or use a "cache-first" mentality or a "stale-while-revalidate" approach.
  - This might be good time to also build in the ability to have your own custom cache.
- ⬜️ Cache with dynamic keys "hashing". This would be similar to how `react-query` does it—if you pass a string it just uses the string as the cache key, if you pass an array of values it merges all the values into a single request key.
- ⬜️ Retries on errors?
- ⬜️ Cancel the request if the component unmounts before it completes?
  - https://medium.com/@bramus/cancel-a-javascript-promise-with-abortcontroller-3540cbbda0a9
- automatic garbage collection a la react-query?

# rhdf
