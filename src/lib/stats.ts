export type UserStats = {
  streak: number;
  totalSolves: number;
  hintsUsed: number;
  solveTimes: number[];
  lastSolve: string;
};

// In-memory storage for user stats
export const userStats: Record<string, UserStats> = {};

// Helper function to update stats
export function updateStats(fid: string, hintsUsed: number, solveTime: number) {
  if (!userStats[fid]) {
    userStats[fid] = {
      streak: 0,
      totalSolves: 0,
      hintsUsed: 0,
      solveTimes: [],
      lastSolve: '',
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const stats = userStats[fid];
  
  // Update streak
  if (stats.lastSolve === today) {
    // Already solved today
  } else if (stats.lastSolve === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
    // Solved yesterday, increment streak
    stats.streak++;
  } else {
    // Streak broken
    stats.streak = 1;
  }

  stats.totalSolves++;
  stats.hintsUsed += hintsUsed;
  stats.solveTimes.push(solveTime);
  stats.lastSolve = today;

  // Keep only last 10 solve times
  if (stats.solveTimes.length > 10) {
    stats.solveTimes = stats.solveTimes.slice(-10);
  }
} 