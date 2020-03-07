import 'react-app-polyfill/ie11'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useQuery, CacheContextProvider } from '../src'

const url = (id: string) =>
  `https://jsonplaceholder.typicode.com/users/${id}/posts`

interface Post {
  id: string
  title: string
}

const defaultCache = new Map()

const fetcher = (topic: string): Promise<Post[]> =>
  fetch(url(topic))
    .then(res => {
      if (res.status >= 400) throw new Error('Bad request 😱')
      return res.json()
    })
    .then(res => res)

export function Posts() {
  const [id, setId] = React.useState('1')

  return (
    <div style={{ margin: '0 auto' }}>
      <PostCount id={id} />

      <div style={{ height: '16px' }} />
      <button type="button" onClick={() => setId('1')}>
        1
      </button>
      <button type="button" onClick={() => setId('2')}>
        2
      </button>
      <button type="button" onClick={() => setId('3')}>
        3
      </button>
      <button type="button" onClick={() => setId('4')}>
        4
      </button>

      <PostList id={id} />
    </div>
  )
}

function PostCount({ id }) {
  const fetchPosts = React.useCallback(() => fetcher(id), [id])
  const { data: posts, status, error } = useQuery(`users/${id}`, fetchPosts)

  return (
    <>
      {status === 'error' && <div>Count unavailable</div>}
      {status === 'loading' && <div>Loading count...</div>}
      {status === 'success' && <div>{posts?.length ?? 0} posts</div>}
    </>
  )
}

function PostList({ id }) {
  const fetchPosts = React.useCallback(() => fetcher(id), [id])
  const { data: posts, status, error } = useQuery(`users/${id}`, fetchPosts)

  if (status === 'error' && !!error) {
    return <div>{error.message}</div>
  }

  if (status === 'loading') {
    return <div>Loading repos...</div>
  }

  if (status === 'success' && !!posts) {
    return (
      <div>
        <ul
          style={{ listStyleType: 'none', textAlign: 'left', paddingLeft: 0 }}
        >
          {posts.map(post => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      </div>
    )
  }

  return null
}

const App = () => {
  const [cache, setCache] = React.useState(defaultCache)
  return (
    <CacheContextProvider cache={cache}>
      <Posts />
      <div style={{ height: '16px' }} />
      <button onClick={() => setCache(new Map())}>flush cache</button>
    </CacheContextProvider>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
