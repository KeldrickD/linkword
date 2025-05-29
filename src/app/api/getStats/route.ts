import { NextRequest, NextResponse } from 'next/server';
import { userStats } from '../../../lib/stats';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const fid = searchParams.get('fid');
  
  if (!fid) {
    return NextResponse.json({ error: 'FID required' }, { status: 400 });
  }

  const stats = userStats[fid] || {
    streak: 0,
    totalSolves: 0,
    hintsUsed: 0,
    solveTimes: [],
    lastSolve: '',
  };

  // Calculate average solve time
  const avgSolveTime = stats.solveTimes.length > 0
    ? Math.round(stats.solveTimes.reduce((a, b) => a + b, 0) / stats.solveTimes.length)
    : 0;

  return NextResponse.json({
    streak: stats.streak,
    totalSolves: stats.totalSolves,
    hintsUsed: stats.hintsUsed,
    avgSolveTime,
    lastSolve: stats.lastSolve,
  });
} 