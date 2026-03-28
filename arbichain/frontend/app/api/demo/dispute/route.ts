import { NextRequest, NextResponse } from 'next/server';
import {
  disputeCreateTask,
  disputeSubmitGarbage,
  disputeOpenDispute,
  disputeSellerEscalateSilence,
  disputeAnalyzeEvidence,
  disputePanelVote,
  disputeResolve
} from '@/lib/demo-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { step } = await req.json();

    let result;
    switch (step) {
      case 'create-task':
        result = await disputeCreateTask();
        break;
      case 'submit-garbage':
        result = await disputeSubmitGarbage();
        break;
      case 'open-dispute':
        result = await disputeOpenDispute();
        break;
      case 'seller-escalate-silence':
        result = await disputeSellerEscalateSilence();
        break;
      case 'analyze-evidence':
        result = await disputeAnalyzeEvidence();
        break;
      case 'panel-vote-1':
        result = await disputePanelVote(0);
        break;
      case 'panel-vote-2':
        result = await disputePanelVote(1);
        break;
      case 'resolve':
        result = await disputeResolve();
        break;
      default:
        return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
    }

    return NextResponse.json({ step, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
