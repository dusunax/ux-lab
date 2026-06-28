'use client';

import { useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase-client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
      } else {
        const { user: anon } = await signInAnonymously(auth);
        setUser(anon);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function getIdToken(): Promise<string | null> {
    if (!user) return null;
    return user.getIdToken();
  }

  return { user, loading, getIdToken };
}
