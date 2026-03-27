import { NextResponse } from 'next/server';
import { getAgents, getFilecoinStatus } from '@/lib/demo-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [agents, filecoin] = await Promise.all([getAgents(), getFilecoinStatus()]);
    return NextResponse.json({ ...agents, filecoin });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
