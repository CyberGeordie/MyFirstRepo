import { Button } from './ui/Button';

interface Props {
  isListening: boolean;
  isSupported: boolean;
  onToggleListening: () => void;
  onNewCard: () => void;
}

export function GameControls({ isListening, isSupported, onToggleListening, onNewCard }: Props) {
  return (
    <div className="space-y-3 mt-4">
      {!isSupported && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 text-center">
          Speech recognition isn't available in your browser. You can still play by tapping squares manually.
        </div>
      )}
      <div className="flex gap-3 justify-center">
        {isSupported && (
          <Button
            variant={isListening ? 'secondary' : 'primary'}
            onClick={onToggleListening}
          >
            {isListening ? '⏹️ Stop Listening' : '🎤 Start Listening'}
          </Button>
        )}
        <Button variant="secondary" onClick={onNewCard}>
          🔄 New Card
        </Button>
      </div>
    </div>
  );
}
