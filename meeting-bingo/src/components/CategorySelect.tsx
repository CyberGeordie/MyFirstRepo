import type { CategoryId } from '../types';
import { CATEGORIES } from '../data/categories';
import { Button } from './ui/Button';

interface Props {
  onSelect: (id: CategoryId) => void;
  onBack: () => void;
}

export function CategorySelect({ onSelect, onBack }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Choose Your Buzzword Pack</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="flex-1 bg-white border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 hover:shadow-md transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <div className="font-semibold text-gray-900 mb-1">{cat.name}</div>
              <div className="text-xs text-gray-500 mb-3">{cat.description}</div>
              <div className="text-xs text-gray-400 space-y-0.5">
                {cat.words.slice(0, 3).map(w => <div key={w}>{w}</div>)}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={onBack}>← Back to Home</Button>
        </div>
      </div>
    </div>
  );
}
