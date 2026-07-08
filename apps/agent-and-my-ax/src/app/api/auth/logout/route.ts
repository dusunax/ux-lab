import { NextResponse } from 'next/server';
import { createExpiredAuthCookie } from '@/server/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(createExpiredAuthCookie());
  return response;
}
