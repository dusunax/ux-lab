import { useState, useEffect, useCallback } from 'react'
import AlbumList from './features/album/AlbumList'
import Album from './features/album/Album'

type AppRoute =
  | { path: '/'; }
  | { path: '/album'; year: number; page: number; hasPageSegment: boolean }

function parseRoute(): AppRoute {
  const path = window.location.pathname
  const m = path.match(/^\/album\/(\d+)(?:\/page\/(\d+))?$/)
  if (m) {
    return {
      path: '/album',
      year: parseInt(m[1], 10),
      page: m[2] ? parseInt(m[2], 10) : 0,
      hasPageSegment: m[2] !== undefined,
    }
  }
  return { path: '/' }
}

export type Navigate = (url: string, replace?: boolean) => void

export default function App() {
  const [route, setRoute] = useState<AppRoute>(parseRoute)

  useEffect(() => {
    const onPop = () => setRoute(parseRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback<Navigate>((url, replace = false) => {
    if (replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    setRoute(parseRoute())
  }, [])

  if (route.path === '/album') {
    return <Album year={route.year} initialPage={route.page} initialOpen={route.hasPageSegment} navigate={navigate} />
  }

  return <AlbumList navigate={navigate} />
}
