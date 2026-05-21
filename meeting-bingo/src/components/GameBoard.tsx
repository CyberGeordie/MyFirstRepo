import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { GameState, WinningLine, Toast } from '../types';
import { BingoCard } from './BingoCard';
import { TranscriptPanel } from './TranscriptPanel';
import { GameControls } from './GameControls';
import { ToastContainer } from './ui/Toast';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { checkForBingo, countFilled, getClosestToWin } from '../lib/bingoChecker';
import { detectWordsWithAliases } from '../lib/wordDetector';
import { generateCard } from '../lib/cardGenerator';
import { CATEGORIES } from '../data/categories';

interface Props {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  onWin: (winningLine: WinningLine, winningWord: string) => void;
}

export function GameBoard({ game, setGame, onWin }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [detectedWords, setDetectedWords] = useState<string[]>([]);

  const speech = useSpeechRecognition();

  const addToast = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type: 'success' }]);
  }, []);

  const handleResult = useCallback((newTranscript: string) => {
    setGame(prev => {
      if (!prev.card) return prev;

      const alreadyFilled = new Set(
        prev.card.squares.flat().filter(sq => sq.isFilled && !sq.isFreeSpace).map(sq => sq.word.toLowerCase()),
      );

      const found = detectWordsWithAliases(newTranscript, prev.card.words, alreadyFilled);
      if (found.length === 0) return prev;

      const foundSet = new Set(found.map(w => w.toLowerCase()));
      const updatedSquares = prev.card.squares.map(row =>
        row.map(sq => foundSet.has(sq.word.toLowerCase()) && !sq.isFilled
          ? { ...sq, isFilled: true, isAutoFilled: true, filledAt: Date.now() }
          : sq,
        ),
      );

      const updatedCard = { ...prev.card, squares: updatedSquares };
      const winningLine = checkForBingo(updatedCard);
      const newFilled = countFilled(updatedCard);

      found.forEach(w => addToast(`✨ "${w}" detected!`));
      setDetectedWords(d => [...d, ...found]);

      if (winningLine) {
        setTimeout(() => onWin(winningLine, found[found.length - 1]), 0);
      }

      return { ...prev, card: updatedCard, filledCount: newFilled };
    });
  }, [setGame, addToast, onWin]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    setGame(prev => {
      if (!prev.card) return prev;
      const sq = prev.card.squares[row][col];
      if (sq.isFreeSpace) return prev;

      const updatedSquares = prev.card.squares.map((r, ri) =>
        r.map((s, ci) => ri === row && ci === col ? { ...s, isFilled: !s.isFilled, filledAt: !s.isFilled ? Date.now() : null } : s),
      );
      const updatedCard = { ...prev.card, squares: updatedSquares };
      const winningLine = checkForBingo(updatedCard);
      const newFilled = countFilled(updatedCard);

      if (winningLine && !sq.isFilled) {
        setTimeout(() => onWin(winningLine, sq.word), 0);
      }

      return { ...prev, card: updatedCard, filledCount: newFilled };
    });
  }, [setGame, onWin]);

  const handleToggleListening = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
      setGame(prev => ({ ...prev, isListening: false }));
    } else {
      speech.startListening(handleResult);
      setGame(prev => ({ ...prev, isListening: true }));
    }
  }, [speech, setGame, handleResult]);

  const handleNewCard = useCallback(() => {
    if (!game.category) return;
    const card = generateCard(game.category);
    speech.stopListening();
    speech.resetTranscript();
    setDetectedWords([]);
    setGame(prev => ({ ...prev, card, isListening: false, filledCount: 1, winningLine: null, winningWord: null }));
  }, [game.category, speech, setGame]);

  if (!game.card) return null;

  const category = CATEGORIES.find(c => c.id === game.category);
  const closest = getClosestToWin(game.card);
  const filled = game.filledCount - 1; // exclude free space

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900">🎯 Meeting Bingo</span>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {game.isListening && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Listening</span>}
          <span className="font-medium">{filled}/24 filled</span>
          {category && <span className="hidden sm:inline text-gray-400">{category.icon} {category.name}</span>}
        </div>
      </div>

      <div className="flex-1 p-4 max-w-sm mx-auto w-full space-y-4">
        {closest?.needed === 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center text-sm font-semibold text-amber-800 animate-pulse">
            🔥 One away from BINGO! ({closest.line})
          </div>
        )}

        <BingoCard card={game.card} winningLine={game.winningLine} onSquareClick={handleSquareClick} />

        <TranscriptPanel
          transcript={speech.transcript}
          interimTranscript={speech.interimTranscript}
          detectedWords={detectedWords}
          isListening={speech.isListening}
          error={speech.error}
        />

        <GameControls
          isListening={speech.isListening}
          isSupported={speech.isSupported}
          onToggleListening={handleToggleListening}
          onNewCard={handleNewCard}
        />
      </div>

      <ToastContainer toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
