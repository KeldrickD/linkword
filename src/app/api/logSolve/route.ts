import { NextRequest, NextResponse } from 'next/server';
import { updateStats } from '../../../lib/stats';

export async function POST(req: NextRequest) {
  const { fid, hintsUsed, solveTime } = await req.json();
  
  if (!fid || typeof hintsUsed !== 'number' || typeof solveTime !== 'number') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Update user stats
  updateStats(fid, hintsUsed, solveTime);

  return NextResponse.json({ success: true });
} 