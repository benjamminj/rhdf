# Rhdf — React Hooks for Data Fetching

## Roadmap

- ✅ useQuery hook that fires off request on mount
- ✅ customize the request
- ✅ use a cache, have query hook check cache
- ✅ put cache in context
- ✅ dep injection on the cache so that it can render on the server.
- ✅ make cache aware of promises being run
- ⬜️ Test using parallel requests to see how it handles concurrent rendering
  - This will need to make sure that the promises keep duplicate requests from firing, basically if one is in flight then set all of them to "loading"
- ⬜️ useMutation for "write" operations?
  - This would need to optimistically update the client side with a promise in the background that handles when it actually resolves properly.
- ⬜️ suspense compatability?
  - should it be opt-in? Like a "suspense" flag either on a config ctx or in the `useQuery` hook itself.
- ⬜️ Custom caching strategies
   - The idea would be to let you customize default caching strategies or per-request strategies. For example, you might be able to set a request to revalidate on a poll interval or use a "cache-first" mentality or a "stale-while-revalidate" approach.
   - This might be good time to also build in the ability to have your own custom cache.
- ⬜️ Cache with dynamic keys "hashing". This would be similar to how `react-query` does it—if you pass a string it just uses the string as the cache key, if you pass an array of values it merges all the values into a single request key.
