import { NextRequest, NextResponse } from 'next/server';
import { updateStats } from '../getStats/route';

export async function POST(req: NextRequest) {
  const { fid, hintsUsed, solveTime } = await req.json();
  
  if (!fid) {
    return NextResponse.json({ error: 'FID required' }, { status: 400 });
  }

  // Update user stats
  updateStats(fid, hintsUsed || 0, solveTime || 0);

  return NextResponse.json({ success: true });
} 