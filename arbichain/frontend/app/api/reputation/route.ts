import { NextResponse } from 'next/server';
import { getReputationTerms } from '@/lib/demo-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const terms = await getReputationTerms();
    return NextResponse.json(terms);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
