import { NextResponse } from 'next/server';
import { puzzles } from '@/lib/puzzles';

export async function GET() {
  // pick one at random (or cycle through)
  const choice = puzzles[Math.floor(Math.random() * puzzles.length)];
  // strip out the answer
  const { id, words } = choice;
  return NextResponse.json({ id, words });
} 