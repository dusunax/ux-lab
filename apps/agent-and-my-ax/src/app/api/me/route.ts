import { NextResponse } from 'next/server';
import { getAuthPayload, getUserFromRequest } from '@/server/auth';

export function GET(request: Request) {
  const user = getUserFromRequest(request);
  return NextResponse.json({
    user,
    auth: getAuthPayload(user),
  });
}
