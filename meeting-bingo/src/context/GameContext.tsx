import { createContext, useContext } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import type { GameState } from '../types';

interface GameContextValue {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameContext.Provider');
  return ctx;
}

export const INITIAL_GAME_STATE: GameState = {
  version: 1,
  status: 'idle',
  category: null,
  card: null,
  isListening: false,
  startedAt: null,
  completedAt: null,
  winningLine: null,
  winningWord: null,
  filledCount: 0,
};

export function GameProvider({ game, setGame, children }: GameContextValue & { children: ReactNode }) {
  return (
    <GameContext.Provider value={{ game, setGame }}>
      {children}
    </GameContext.Provider>
  );
}
