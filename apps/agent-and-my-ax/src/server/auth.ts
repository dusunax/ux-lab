import { cookies } from 'next/headers';
import { findUser, users } from '@/data/mock';
import type { UserProfile } from '@/types';

export const AUTH_COOKIE_NAME = 'agent_my_ax_user_id';

export interface AuthPayload {
  provider: 'Google Workspace SSO';
  mode: 'mock-shell';
  loginRequired: boolean;
}

export function getUserFromRequest(request: Request): UserProfile | null {
  const cookie = request.headers.get('cookie') ?? '';
  const userId = parseCookie(cookie)[AUTH_COOKIE_NAME];
  return getUserById(userId);
}

export async function getAuthenticatedUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  return getUserById(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function getDefaultLoginUser(): UserProfile {
  return users[0];
}

export function getUserById(userId: string | undefined): UserProfile | null {
  if (!userId) return null;
  return users.some((user) => user.id === userId) ? findUser(userId) : null;
}

export function getAuthPayload(user: UserProfile | null): AuthPayload {
  return {
    provider: 'Google Workspace SSO',
    mode: 'mock-shell',
    loginRequired: !user,
  };
}

export function createAuthCookie(userId: string) {
  return {
    name: AUTH_COOKIE_NAME,
    value: userId,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function createExpiredAuthCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

export function unauthorized() {
  return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
}

function parseCookie(cookie: string): Record<string, string> {
  return Object.fromEntries(
    cookie
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...value] = part.split('=');
        return [decodeURIComponent(key), decodeURIComponent(value.join('='))];
      }),
  );
}
