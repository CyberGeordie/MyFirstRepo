import type { BingoSquare as BingoSquareType } from '../types';

interface Props {
  square: BingoSquareType;
  isWinningSquare: boolean;
  onClick: () => void;
}

export function BingoSquare({ square, isWinningSquare, onClick }: Props) {
  const { word, isFilled, isAutoFilled, isFreeSpace } = square;

  let className =
    'aspect-square min-h-[44px] min-w-[44px] p-1 border-2 rounded-lg transition-all duration-200 ' +
    'flex flex-col items-center justify-center text-center ' +
    'text-[10px] sm:text-xs font-medium leading-tight ' +
    'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 ';

  if (isWinningSquare) {
    className += 'bg-green-500 border-green-600 text-white ring-2 ring-green-300 ';
  } else if (isFreeSpace) {
    className += 'bg-amber-100 border-amber-300 text-amber-700 cursor-default ';
  } else if (isFilled) {
    className += 'bg-blue-500 border-blue-600 text-white ' + (isAutoFilled ? 'border-dashed ' : '');
  } else {
    className += 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 ';
  }

  return (
    <button
      onClick={onClick}
      disabled={isFreeSpace}
      role="gridcell"
      aria-label={isFreeSpace ? 'Free space' : `${word}${isFilled ? ', filled' : ''}`}
      aria-pressed={isFilled}
      className={className}
    >
      <span className={`break-words ${isFilled && !isFreeSpace ? 'line-through opacity-90' : ''}`}>
        {isFreeSpace ? '⭐ FREE' : word}
      </span>
      {isAutoFilled && !isWinningSquare && (
        <span className="text-[8px] mt-0.5 opacity-75">✨</span>
      )}
    </button>
  );
}
