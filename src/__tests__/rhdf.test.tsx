import '@testing-library/jest-dom/extend-expect'
import {
  cleanup,
  render,
  fireEvent,
  wait,
  waitFor,
} from '@testing-library/react'
import React, { useState } from 'react'
import { CacheContextProvider, useQuery, useMutation } from '../index'

// import mutationObserver from '@sheerun/mutationobserver-shim'

// window.MutationObserver = mutationObserver

describe('useQuery', () => {
  afterEach(cleanup)

  test('fires the fetcher on mounting', async () => {
    const fetcher = jest.fn(() => Promise.resolve('test'))
    const TestComponent = () => {
      const a = useQuery('/a', fetcher)
      return <div>{a.status === 'loading' && 'loading'}</div>
    }

    const { findByText } = render(
      <CacheContextProvider>
        <TestComponent />
      </CacheContextProvider>
    )

    await findByText('loading')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('immediately returns data if found in the cache', async () => {
    const fetcher = jest.fn(() => Promise.resolve('test'))

    const TestComponent = () => {
      const a = useQuery('/a', fetcher)
      return <div>{a.status === 'success' && a.data}</div>
    }

    const cache = new Map()
    cache.set('/a', 'A')
    const { findByText } = render(
      <CacheContextProvider cache={cache}>
        <TestComponent />
      </CacheContextProvider>
    )

    await findByText('A')
    expect(fetcher).toHaveBeenCalledTimes(0)
  })

  test("doesn't fire duplicate requests if one is already in flight", async () => {
    const fetcher = jest.fn(() => Promise.resolve('test'))

    const TestComponent = () => {
      const a = useQuery('/a', fetcher)
      const b = useQuery('/a', fetcher)

      return (
        <div>
          <p>{a.status === 'success' && b.status === 'success' && 'loaded'}</p>
        </div>
      )
    }

    const { findByText } = render(
      <CacheContextProvider>
        <TestComponent />
      </CacheContextProvider>
    )

    await findByText('loaded')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test("doesn't fire duplicate requests when resetting the cache", async () => {
    const fetcher = jest.fn(() => Promise.resolve('test'))

    const TestComponent = () => {
      const a = useQuery('/a', fetcher)
      const b = useQuery('/a', fetcher)

      return (
        <div>
          <p>{a.status === 'success' && b.status === 'success' && a.data}</p>
        </div>
      )
    }

    const cache = new Map()
    cache.set('/a', 'A')

    const { findByText, rerender } = render(
      <CacheContextProvider cache={cache}>
        <TestComponent />
      </CacheContextProvider>
    )

    await findByText('A')
    expect(fetcher).toHaveBeenCalledTimes(0)

    rerender(
      <CacheContextProvider cache={new Map()}>
        <TestComponent />
      </CacheContextProvider>
    )

    await findByText('test')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('returns an error state if promise threw an error', async () => {
    const fetcher = jest.fn().mockRejectedValue('😱')

    const TestComponent = () => {
      const a = useQuery('/a', fetcher)
      return (
        <div>
          <p>{a.status === 'error' && '😱'}</p>
        </div>
      )
    }

    const { findByText } = render(
      <CacheContextProvider>
        <TestComponent />
      </CacheContextProvider>
    )

    await findByText('😱')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('returns an loading state if promise is unresolved, and the data if resolved', async () => {
    const fetcher = jest.fn().mockResolvedValue('testdata')

    const TestComponent = () => {
      const a = useQuery<string>('/a', fetcher)
      return (
        <div>
          <p>{a.status === 'loading' && 'loading'}</p>
          <p>{a.status === 'success' && a.data}</p>
        </div>
      )
    }

    const { getByText, findByText } = render(
      <CacheContextProvider>
        <TestComponent />
      </CacheContextProvider>
    )

    expect(getByText('loading')).toBeInTheDocument()

    await findByText('testdata')
    expect(getByText('testdata')).toBeInTheDocument()
  })
})

describe('mutate', () => {
  test('should update the value in the cache', async () => {
    const updater = jest.fn().mockResolvedValue('updated')
    const fetcher = jest.fn().mockResolvedValue('original')

    const TestComponent = () => {
      const a = useQuery<string>('/a', fetcher)
      const { mutate } = useMutation('/a')
      return (
        <div>
          <p>{a.status === 'loading' && 'loading'}</p>
          <p>{a.status === 'success' && a.data}</p>
          <button onClick={() => mutate(updater)}>update</button>
        </div>
      )
    }

    const { getByText, findByText } = render(
      <CacheContextProvider>
        <TestComponent />
      </CacheContextProvider>
    )

    await findByText('original')

    fireEvent.click(getByText('update'))

    await findByText('updated')
    expect(getByText('updated')).toBeInTheDocument()
  })

  test('should allow mutating a new value into the cache', async () => {
    const updater = jest.fn().mockResolvedValue('updated')
    const fetcher = jest.fn().mockResolvedValue('original')

    const TestData = () => {
      const a = useQuery<string>('/a', fetcher)
      return <div>{a.status === 'success' && a.data}</div>
    }

    const TestComponent = () => {
      const { mutate } = useMutation('/a')
      const [isVisible, setIsVisible] = useState(false)
      return (
        <div>
          <button onClick={() => mutate(updater)}>update</button>
          <button onClick={() => setIsVisible(true)}>display data</button>
          {isVisible && <TestData />}
        </div>
      )
    }

    const { getByText } = render(
      <CacheContextProvider>
        <TestComponent />
      </CacheContextProvider>
    )

    fireEvent.click(getByText('update'))
    await waitFor(() => expect(updater).toHaveBeenCalledTimes(1))

    fireEvent.click(getByText('display data'))
    expect(getByText('updated')).toBeInTheDocument()
    expect(fetcher).not.toHaveBeenCalled()
  })

  test('should allow updating based on the previous cache value', async () => {
    const fetcher = async () => 0

    const TestComponent = () => {
      const a = useQuery<number>('/a', fetcher)
      const { mutate } = useMutation<number>('/a')
      return (
        <div>
          <p>{a.status === 'loading' && 'loading'}</p>
          <p>{a.status === 'success' && a.data}</p>
          <button onClick={() => mutate(prev => prev + 1)}>update</button>
        </div>
      )
    }

    const cache = new Map([['/a', 1]])
    const { getByText, findByText } = render(
      <CacheContextProvider cache={cache}>
        <TestComponent />
      </CacheContextProvider>
    )

    await findByText('1')

    fireEvent.click(getByText('update'))

    await findByText('2')
    expect(getByText('2')).toBeInTheDocument()
  })
})
