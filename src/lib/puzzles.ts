export type Puzzle = {
  id: string;
  words: string[];
  answer: string;
  hintClue: string;
};

export const puzzles: Puzzle[] = [
  {
    id: '2025-05-29',
    words: ['river', 'money', 'savings', 'piggy'],
    answer: 'bank',
    hintClue: 'An establishment where money is kept and managed.',
  },
  {
    id: '2025-05-30',
    words: ['star', 'wars', 'trek', 'gate'],
    answer: 'wars',
    hintClue: 'A series of conflicts between opposing forces.',
  },
  {
    id: '2025-05-31',
    words: ['apple', 'banana', 'orange', 'grape'],
    answer: 'fruit',
    hintClue: 'A sweet and nutritious food that grows on trees and plants.',
  },
  {
    id: '2025-06-01',
    words: ['dog', 'cat', 'bird', 'fish'],
    answer: 'pet',
    hintClue: 'A domesticated animal kept for companionship.',
  },
  {
    id: '2025-06-02',
    words: ['red', 'blue', 'green', 'yellow'],
    answer: 'color',
    hintClue: 'A visual attribute of objects that results from the light they reflect.',
  },
  {
    id: '2025-06-03',
    words: ['book', 'pen', 'pencil', 'paper'],
    answer: 'school',
    hintClue: 'A place where students learn and study.',
  },
  {
    id: '2025-06-04',
    words: ['coffee', 'tea', 'water', 'juice'],
    answer: 'drink',
    hintClue: 'A liquid that can be consumed for refreshment.',
  },
  {
    id: '2025-06-05',
    words: ['pizza', 'burger', 'fries', 'sandwich'],
    answer: 'food',
    hintClue: 'Any nutritious substance that people or animals eat.',
  },
  {
    id: '2025-06-06',
    words: ['monday', 'tuesday', 'wednesday', 'thursday'],
    answer: 'day',
    hintClue: 'A 24-hour period that makes up a week.',
  },
  {
    id: '2025-06-07',
    words: ['january', 'february', 'march', 'april'],
    answer: 'month',
    hintClue: 'A division of the year based on the calendar.',
  }
];

export function getTodayPuzzle(): Puzzle {
  const today = new Date().toISOString().slice(0, 10);
  return puzzles.find((p) => p.id === today) || puzzles[0];
}

export function getRandomPuzzle(): Puzzle {
  return puzzles[Math.floor(Math.random() * puzzles.length)];
} 