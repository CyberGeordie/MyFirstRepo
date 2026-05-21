import { Button } from './ui/Button';

interface Props {
  onStart: () => void;
}

export function LandingPage({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">🎯 Meeting Bingo</h1>
          <p className="text-xl text-gray-600">Turn any meeting into a game.</p>
          <p className="text-gray-500 mt-1">Auto-detects buzzwords using speech recognition!</p>
        </div>

        <Button size="lg" onClick={onStart} className="w-full text-lg">
          🎮 New Game
        </Button>

        <p className="text-sm text-gray-500">
          🔒 Audio processed locally. Never recorded.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-left space-y-3">
          <h2 className="font-semibold text-gray-700 text-center mb-4">How It Works</h2>
          {[
            ['1️⃣', 'Pick a buzzword category'],
            ['2️⃣', 'Enable microphone for auto-detection'],
            ['3️⃣', 'Join your meeting and listen'],
            ['4️⃣', 'Watch squares fill automatically!'],
          ].map(([num, text]) => (
            <div key={num} className="flex items-center gap-3">
              <span className="text-xl">{num}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
