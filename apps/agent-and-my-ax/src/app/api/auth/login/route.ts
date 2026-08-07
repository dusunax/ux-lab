import { NextResponse } from 'next/server';
import { createAuthCookie, getDefaultLoginUser, getUserById } from '@/server/auth';

export async function POST(request: Request) {
  let userId = getDefaultLoginUser().id;

  try {
    const body = (await request.json()) as { userId?: unknown };
    if (typeof body.userId === 'string' && body.userId.trim()) {
      userId = body.userId.trim();
    }
  } catch {
    // Empty body is allowed for the mock SSO login button.
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'Unknown mock user' }, { status: 400 });
  }

  const response = NextResponse.json({ user });
  response.cookies.set(createAuthCookie(user.id));
  return response;
}
