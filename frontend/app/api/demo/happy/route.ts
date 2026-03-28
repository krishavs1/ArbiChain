import { NextRequest, NextResponse } from 'next/server';
import { happyCreateTask, happySubmitDeliverable, happyApprove, happyCancelForMissedDelivery } from '@/lib/demo-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { step } = await req.json();

    let result;
    switch (step) {
      case 'create-task':
        result = await happyCreateTask();
        break;
      case 'submit-deliverable':
        result = await happySubmitDeliverable();
        break;
      case 'approve':
        result = await happyApprove();
        break;
      case 'cancel-missed-delivery':
        result = await happyCancelForMissedDelivery();
        break;
      default:
        return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
    }

    return NextResponse.json({ step, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
