import { NextResponse } from 'next/server';
import { getTodayPuzzle } from '@/lib/puzzles';

export async function GET() {
  const puzzle = getTodayPuzzle();
  return NextResponse.json(puzzle);
} 