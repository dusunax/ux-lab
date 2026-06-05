import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { CombinedDemo } from './pages/CombinedDemo'
import { UnderwaterPoseReactive } from './demos/PoseReactive/underwater/UnderwaterPoseReactive'

function Router() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (hash === '#combined') return <CombinedDemo />
  if (hash === '#pose/underwater') return <UnderwaterPoseReactive />
  return <App />
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <Router />
  </StrictMode>
)
