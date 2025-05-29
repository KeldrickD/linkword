import { NextRequest, NextResponse } from 'next/server';
import { getTodayPuzzle } from '@/lib/puzzles';

export async function POST(req: NextRequest) {
  const { guess } = await req.json();
  const { answer } = getTodayPuzzle();
  const correct = guess.trim().toLowerCase() === answer;
  return NextResponse.json({ correct });
} 