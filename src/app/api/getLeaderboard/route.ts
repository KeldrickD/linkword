import { NextRequest, NextResponse } from 'next/server';
import { userStats } from '../../../lib/stats';

export async function GET(req: NextRequest) {
  // Convert userStats to array and sort by streak
  const leaderboard = Object.entries(userStats)
    .map(([fid, stats]) => ({
      fid,
      streak: stats.streak,
      totalSolves: stats.totalSolves,
      hintsUsed: stats.hintsUsed,
    }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10); // Get top 10

  return NextResponse.json(leaderboard);
} 