'use client';
import { useState, useEffect } from 'react';
import { useFrame } from '../components/providers/FrameProvider';
import { purchaseUnit } from '../lib/payments';
import { mintWinNft } from '../lib/nft';
import { Input } from './ui/input';
import sdk from '@farcaster/frame-sdk';

const FREE_HINTS = 1;
const FREE_PLAYS = 0;   // no extra puzzles by default
const EXTRA_STORE_UNITS = 2;

// localStorage keys
const HINT_KEY = 'linkword_hints';
const PLAY_KEY = 'linkword_plays';

type UserStats = {
  streak: number;
  totalSolves: number;
  hintsUsed: number;
  avgSolveTime: number;
  lastSolve: string;
};

type LeaderboardEntry = {
  fid: string;
  streak: number;
  totalSolves: number;
  hintsUsed: number;
  avgSolveTime: number;
  lastSolve: string;
};

type Period = 'daily' | 'weekly' | 'all-time';

export default function LinkWord() {
  const frame = useFrame();
  const [words, setWords] = useState<string[]>([]);
  const [guess, setGuess] = useState('');
  const [answer, setAnswer] = useState('');
  const [hintClue, setHintClue] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [hintsLeft, setHintsLeft] = useState(FREE_HINTS);
  const [playsLeft, setPlaysLeft] = useState(FREE_PLAYS);
  const [hasShared, setHasShared] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    streak: 0,
    totalSolves: 0,
    hintsUsed: 0,
    avgSolveTime: 0,
    lastSolve: '',
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<Period>('daily');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [minted, setMinted] = useState(false);
  const [puzzleId, setPuzzleId] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);

  // Load saved state from localStorage
  useEffect(() => {
    const savedHints = Number(localStorage.getItem(HINT_KEY));
    const savedPlays = Number(localStorage.getItem(PLAY_KEY));
    if (!isNaN(savedHints)) setHintsLeft(savedHints);
    if (!isNaN(savedPlays)) setPlaysLeft(savedPlays);
  }, []);

  // Load stats and leaderboard
  const loadStats = async () => {
    if (!frame.isSDKLoaded) {
      console.log('SDK not loaded yet, skipping stats load');
      return;
    }
    
    if (frame.context?.user.fid) {
      try {
        console.log('Loading stats for FID:', frame.context.user.fid);
        const statsRes = await fetch(`/api/getStats?fid=${frame.context.user.fid}`);
        const statsData = await statsRes.json();
        console.log('Received stats from server:', statsData);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    } else {
      console.log('No FID available for loading stats');
    }
  };

  // Load stats when SDK is ready and FID is available
  useEffect(() => {
    if (frame.isSDKLoaded) {
      console.log('SDK loaded, checking for FID...');
      loadStats();
    }
  }, [frame.isSDKLoaded, frame.context?.user.fid]);

  // Persist hints and plays to localStorage
  useEffect(() => {
    localStorage.setItem(HINT_KEY, hintsLeft.toString());
  }, [hintsLeft]);

  useEffect(() => {
    localStorage.setItem(PLAY_KEY, playsLeft.toString());
  }, [playsLeft]);

  // Load daily puzzle
  useEffect(() => {
    fetch('/api/getPuzzle')
      .then((res) => res.json())
      .then((data) => {
        setWords(data.words);
        setPuzzleId(data.id);
        setAnswer(data.answer);
        setHintClue(data.hintClue);
        setStartTime(Date.now());
      });
  }, []);

  // Fetch random puzzle for extra plays
  const fetchRandom = async () => {
    if (playsLeft > 0) {
      setPlaysLeft(playsLeft - 1);
      const res = await fetch('/api/randomPuzzle');
      const { words: newWords, id, answer: newAnswer, hintClue: newHintClue } = await res.json();
      setWords(newWords);
      setPuzzleId(id);
      setAnswer(newAnswer);
      setHintClue(newHintClue);
      setResult(null);
      setGuess('');
      setHintsUsed(0);
      setMinted(false);
      setStartTime(Date.now());
    }
  };

  // Confetti logic
  const spawnConfetti = () => {
    const colors = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7'];
    const numPieces = 50;
    for (let i = 0; i < numPieces; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      const size = Math.random() * 8 + 4;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.top = '-20px';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(confetti);
      // remove after animation
      setTimeout(() => confetti.remove(), 1500);
    }
  };

  // Submit guess
  const submit = async () => {
    const res = await fetch('/api/checkAnswer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess }),
    });
    const { correct } = await res.json();
    setResult(correct);
    
    // Log solve if correct
    if (correct) {
      const solveTime = Math.round((Date.now() - startTime) / 1000);
      console.log('Correct answer! Logging solve with:', {
        fid: frame.context?.user.fid,
        hintsUsed,
        solveTime
      });
      try {
        const logRes = await fetch('/api/logSolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fid: frame.context?.user.fid,
            hintsUsed,
            solveTime,
          }),
        });
        const logData = await logRes.json();
        console.log('Log solve response:', logData);
        
        // Refresh stats after solve
        console.log('Refreshing stats after solve...');
        await loadStats();
        
        // Show confetti on milestone streaks
        if (stats?.streak && [5, 10, 20].includes(stats.streak)) {
          spawnConfetti();
        }
      } catch (err) {
        console.error('Failed to log solve:', err);
      }
    }
  };

  // Share for free play
  const shareForPlay = async () => {
    try {
      // Use the SDK to compose a cast
      await sdk.actions.composeCast({
        text: `I just solved today's #LinkWord puzzle! Can you beat me?`
      });
      setPlaysLeft(playsLeft + 1);
      setHasShared(true);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  // Mint NFT for win
  const mintNft = async () => {
    if (puzzleId) {
      const ok = await mintWinNft(frame, puzzleId);
      if (ok) setMinted(true);
    }
  };

  // Reveal hint based on level
  const revealHint = async (level: 1 | 2 | 3) => {
    console.log('Revealing hint level:', level, 'Current hints used:', hintsUsed);
    if (level === 1 && hintsLeft > 0) {
      // Free first letter hint
      setHintsLeft(hintsLeft - 1);
      setGuess(answer[0]);
      setHintsUsed(1);
      console.log('Used free hint, refreshing stats...');
      await loadStats();
    } else if (level === 2) {
      // Paid second letter hint
      console.log('Attempting to purchase hint2...');
      const ok = await purchaseUnit(frame, 'hint2', 1);
      console.log('Purchase result:', ok);
      if (ok) {
        console.log('Setting guess with first two letters of answer:', answer.slice(0, 2));
        setGuess(answer.slice(0, 2));
        setHintsUsed(2);
        console.log('Used paid hint, refreshing stats...');
        await loadStats();
      }
    } else if (level === 3) {
      // Paid clue hint
      const ok = await purchaseUnit(frame, 'hint3', 1);
      if (ok) {
        alert(`Clue: ${hintClue}`);
        setHintsUsed(3);
        console.log('Used clue hint, refreshing stats...');
        await loadStats();
      }
    }
  };

  // Purchase extra plays
  const buyPlays = async () => {
    const ok = await purchaseUnit(frame, 'extraPlays', EXTRA_STORE_UNITS);
    if (ok) {
      setPlaysLeft(playsLeft + EXTRA_STORE_UNITS);
      // Immediately fetch a random puzzle
      await fetchRandom();
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Can you find the hidden link?</h1>
      
      {/* Stats Section */}
      {frame.isSDKLoaded && (
        <div className="mb-4 p-4 bg-gray-50 rounded shadow-sm">
          {frame.isConnected ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg">
                  {stats.streak > 0 && (
                    <span className="text-orange-500 animate-pulse">🔥 {stats.streak}-day streak!</span>
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Solves: {stats.totalSolves}</p>
                <p className="text-sm text-gray-600">Hints Used: {stats.hintsUsed}</p>
                <p className="text-sm text-gray-600">Avg Time: {stats.avgSolveTime}s</p>
              </div>
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <p>Connect your Farcaster account to track your stats!</p>
              <p className="text-sm mt-1">Stats will be saved once you connect.</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <div className="mb-4 p-4 bg-gray-50 rounded shadow-sm">
          <div className="flex space-x-2 mb-2">
            {(['daily', 'weekly', 'all-time'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm rounded ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.fid} className="flex justify-between items-center p-2 bg-white rounded">
                <span className="font-mono text-sm">{i + 1}. FID: {entry.fid}</span>
                <div className="flex space-x-4 text-sm">
                  <span>🔥 {entry.streak}</span>
                  <span>⏱️ {entry.avgSolveTime}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {words.map((w) => (
          <div key={w} className="p-3 border rounded text-center">{w}</div>
        ))}
      </div>

      <Input
        aria-label="Your guess"
        className="w-full mb-2"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
      />

      <button onClick={submit} className="w-full py-2 bg-blue-600 text-white rounded">
        Guess the Link
      </button>

      {result !== null && (
        <div className="mt-4 text-center">
          <p className="mb-2">
            {result ? '🎉 Correct!' : '❌ Try again!'}
          </p>
          {result && !minted && (
            <button
              onClick={mintNft}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Mint Your Win NFT
            </button>
          )}
          {result && minted && (
            <p className="mt-2 text-green-600">Your NFT has been minted! 🏅</p>
          )}
          {result && !hasShared && (
            <button
              onClick={shareForPlay}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Share for 1 Free Play
            </button>
          )}
        </div>
      )}

      {/* Hints Section */}
      <div className="mt-6 space-y-2">
        <button
          onClick={() => revealHint(1)}
          className="w-full px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
          disabled={hintsUsed >= 1}
        >
          {hintsLeft > 0
            ? `Free: Reveal First Letter (${hintsLeft} left)`
            : 'Free Hint Used'}
        </button>
        <button
          onClick={() => revealHint(2)}
          className="w-full px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
          disabled={hintsUsed >= 2}
        >
          Buy: Reveal Second Letter ($0.10)
        </button>
        <button
          onClick={() => revealHint(3)}
          className="w-full px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
          disabled={hintsUsed >= 3}
        >
          Buy: Show Clue ($0.20)
        </button>
      </div>

      {/* Extra Plays Section */}
      <div className="mt-6 text-center">
        <button
          onClick={buyPlays}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Buy $0.50 for {EXTRA_STORE_UNITS} Plays
        </button>
        {playsLeft > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Extra Plays: {playsLeft}
          </p>
        )}
      </div>
    </div>
  );
} 