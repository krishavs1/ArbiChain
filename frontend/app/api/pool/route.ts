import { NextRequest, NextResponse } from 'next/server';
import { getPoolStatus, setupPool, getDisputePanel, castPanelVote } from '@/lib/demo-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  try {
    const status = await getPoolStatus();
    return NextResponse.json(status);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, taskId, voterIndex, ruling } = await req.json();

    let result;
    switch (action) {
      case 'setup':
        result = await setupPool();
        break;
      case 'get-panel':
        result = await getDisputePanel(taskId);
        break;
      case 'vote':
        result = await castPanelVote(taskId, voterIndex, ruling);
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ action, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
