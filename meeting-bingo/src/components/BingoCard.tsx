import type { BingoCard as BingoCardType, WinningLine } from '../types';
import { BingoSquare } from './BingoSquare';

interface Props {
  card: BingoCardType;
  winningLine: WinningLine | null;
  onSquareClick: (row: number, col: number) => void;
}

export function BingoCard({ card, winningLine, onSquareClick }: Props) {
  const winningSet = new Set(winningLine?.squares ?? []);

  return (
    <div
      role="grid"
      aria-label="Bingo card"
      className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full max-w-sm mx-auto"
    >
      {card.squares.flat().map(square => (
        <BingoSquare
          key={square.id}
          square={square}
          isWinningSquare={winningSet.has(square.id)}
          onClick={() => onSquareClick(square.row, square.col)}
        />
      ))}
    </div>
  );
}
