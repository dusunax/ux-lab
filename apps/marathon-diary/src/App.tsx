import { useState, useCallback } from 'react'
import AlbumList from './features/album/AlbumList'
import Album from './features/album/Album'
import RaceForm from './features/race/RaceForm'
import RacePage from './features/race/RacePage'

export type Route =
  | { path: '/' }
  | { path: '/album/:year'; year: number }
  | { path: '/race/new' }
  | { path: '/race/:id'; id: string }

export default function App() {
  const [route, setRoute] = useState<Route>({ path: '/' })

  const navigate = useCallback((next: Route) => {
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (route.path === '/album/:year') {
    return <Album year={route.year} onNavigate={navigate} />
  }

  if (route.path === '/race/new') {
    return <RaceForm onNavigate={navigate} />
  }

  if (route.path === '/race/:id') {
    return <RacePage raceId={route.id} onNavigate={navigate} />
  }

  return <AlbumList onNavigate={navigate} />
}
