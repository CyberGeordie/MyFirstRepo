import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { GameState } from '../types';
import { BingoCard } from './BingoCard';
import { Button } from './ui/Button';
import { CATEGORIES } from '../data/categories';
import { shareResult } from '../lib/shareUtils';

interface Props {
  game: GameState;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function WinScreen({ game, onPlayAgain, onHome }: Props) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, []);

  const category = CATEGORIES.find(c => c.id === game.category);
  const elapsed = game.startedAt && game.completedAt
    ? Math.round((game.completedAt - game.startedAt) / 60000)
    : null;
  const filled = game.filledCount - 1;

  const handleShare = async () => {
    try {
      await shareResult(game);
    } catch {
      // share/clipboard failed silently
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">🎉 BINGO! 🎊</h1>
          {game.winningWord && (
            <p className="text-gray-600">Winning word: <strong>"{game.winningWord}"</strong></p>
          )}
        </div>

        {game.card && (
          <div className="ring-4 ring-amber-400 ring-offset-2 rounded-xl overflow-hidden p-1 bg-white">
            <BingoCard card={game.card} winningLine={game.winningLine} onSquareClick={() => {}} />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
          {elapsed != null && <div>⏱️ Time to BINGO: <strong>{elapsed} minute{elapsed === 1 ? '' : 's'}</strong></div>}
          {game.winningWord && <div>🏆 Winning word: <strong>"{game.winningWord}"</strong></div>}
          <div>📊 Squares filled: <strong>{filled}/24</strong></div>
          {category && <div>📦 Category: <strong>{category.name}</strong></div>}
        </div>

        <div className="flex gap-3">
          <Button className="flex-1" variant="secondary" onClick={handleShare}>
            📤 Share Result
          </Button>
          <Button className="flex-1" onClick={onPlayAgain}>
            🔄 Play Again
          </Button>
        </div>

        <Button variant="ghost" onClick={onHome} className="w-full">
          ← Back to Home
        </Button>
      </div>
    </div>
  );
}
