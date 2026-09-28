import { useEffect, useState } from 'react';
import type { AppState } from '../../shared/types';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';

export function App() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    void window.api.getState().then(setState);
    return window.api.onState(setState);
  }, []);

  if (!state) return null;
  return state.auth.status === 'signedIn' ? <Settings state={state} /> : <Login auth={state.auth} />;
}
