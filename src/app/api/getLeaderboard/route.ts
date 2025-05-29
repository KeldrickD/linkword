import { NextRequest, NextResponse } from 'next/server';
import { userStats, UserStats } from '../getStats/route';

type LeaderboardEntry = {
  fid: string;
  streak: number;
  totalSolves: number;
  hintsUsed: number;
  avgSolveTime: number;
  lastSolve: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const period = searchParams.get('period') || 'daily';
  
  // Get all users and their stats
  const allUsers: LeaderboardEntry[] = Object.entries(userStats).map(([fid, stats]) => ({
    fid,
    streak: stats.streak,
    totalSolves: stats.totalSolves,
    hintsUsed: stats.hintsUsed,
    avgSolveTime: stats.solveTimes.length > 0
      ? Math.round(stats.solveTimes.reduce((a, b) => a + b, 0) / stats.solveTimes.length)
      : 0,
    lastSolve: stats.lastSolve,
  }));

  // Sort by streak
  allUsers.sort((a, b) => b.streak - a.streak);

  // Filter by period
  let filteredUsers = allUsers;
  const today = new Date().toISOString().slice(0, 10);
  
  if (period === 'daily') {
    filteredUsers = allUsers.filter(u => u.lastSolve === today);
  } else if (period === 'weekly') {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    filteredUsers = allUsers.filter(u => u.lastSolve >= weekAgo);
  }
  // 'all-time' uses all users

  // Return top 10
  return NextResponse.json(filteredUsers.slice(0, 10));
} 