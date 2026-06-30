import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/agentService';

export function GET() {
  return NextResponse.json({
    user: getCurrentUser(),
    auth: {
      provider: 'Google Workspace SSO',
      mode: 'mock-shell',
      loginRequired: false,
    },
  });
}
