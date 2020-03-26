/**
 * @jest-environment node
 */
import * as React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { useQuery, useCache, CacheContextProvider } from '../index'

describe('SSR', () => {
  test('useQuery should capture the promise', () => {
    const fetcher = jest.fn().mockResolvedValue('testdata')

    const TestComponent = () => {
      useQuery<string>('/a', fetcher)
      const { promises } = useCache()
      return (
        <div>
          <p>promises: {promises.size}</p>
        </div>
      )
    }

    const promises = new Map<string, Promise<any>>()
    ReactDOMServer.renderToString(
      <CacheContextProvider promises={promises}>
        <TestComponent />
      </CacheContextProvider>
    )

    expect(promises.size).toEqual(1)
    expect(promises.get('/a')).resolves.toEqual('testdata')
  })
})
