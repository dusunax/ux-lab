import { NextResponse } from 'next/server';
import { getRankings } from '@/server/agentService';

export function GET() {
  return NextResponse.json(getRankings());
}
