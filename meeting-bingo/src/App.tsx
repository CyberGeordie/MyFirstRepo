import { useState, useEffect } from 'react';
import type { GameState, CategoryId, WinningLine } from './types';
import { LandingPage } from './components/LandingPage';
import { CategorySelect } from './components/CategorySelect';
import { GameBoard } from './components/GameBoard';
import { WinScreen } from './components/WinScreen';
import { GameProvider, INITIAL_GAME_STATE } from './context/GameContext';
import { generateCard } from './lib/cardGenerator';
import './index.css';

type Screen = 'landing' | 'category' | 'game' | 'win';

const STORAGE_KEY = 'meeting-bingo-game';
const STATE_VERSION = 1;

function loadPersistedGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== STATE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [game, setGame] = useState<GameState>(INITIAL_GAME_STATE);
  const [resumeCandidate, setResumeCandidate] = useState<GameState | null>(null);

  useEffect(() => {
    const saved = loadPersistedGame();
    if (saved && saved.status === 'playing' && saved.card) {
      setResumeCandidate(saved);
    }
  }, []);

  useEffect(() => {
    if (game.status !== 'idle') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    }
  }, [game]);

  const handleStart = () => setScreen('category');

  const handleResume = () => {
    if (!resumeCandidate) return;
    setGame({ ...resumeCandidate, isListening: false });
    setResumeCandidate(null);
    setScreen('game');
  };

  const handleCategorySelect = (categoryId: CategoryId) => {
    const card = generateCard(categoryId);
    setGame({ ...INITIAL_GAME_STATE, status: 'playing', category: categoryId, card, startedAt: Date.now(), filledCount: 1 });
    setScreen('game');
  };

  const handleWin = (winningLine: WinningLine, winningWord: string) => {
    setGame(prev => ({ ...prev, status: 'won', completedAt: Date.now(), winningLine, winningWord }));
    setScreen('win');
  };

  const handleHome = () => {
    setGame(INITIAL_GAME_STATE);
    localStorage.removeItem(STORAGE_KEY);
    setResumeCandidate(null);
    setScreen('landing');
  };

  return (
    <GameProvider game={game} setGame={setGame}>
      {screen === 'landing' && (
        <>
          {resumeCandidate && (
            <div className="fixed inset-x-0 top-0 z-50 bg-blue-600 text-white p-3 flex items-center justify-center gap-4 text-sm">
              <span>You have an in-progress game.</span>
              <button onClick={handleResume} className="underline font-semibold">Resume</button>
              <button onClick={() => setResumeCandidate(null)} className="opacity-75 hover:opacity-100">✕</button>
            </div>
          )}
          <LandingPage onStart={handleStart} />
        </>
      )}
      {screen === 'category' && (
        <CategorySelect onSelect={handleCategorySelect} onBack={handleHome} />
      )}
      {screen === 'game' && game.card && (
        <GameBoard game={game} setGame={setGame} onWin={handleWin} />
      )}
      {screen === 'win' && (
        <WinScreen game={game} onPlayAgain={() => setScreen('category')} onHome={handleHome} />
      )}
    </GameProvider>
  );
}
