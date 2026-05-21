const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access denied. Please allow access in your browser settings.',
  'no-speech': 'No speech detected. Speak clearly near your microphone.',
  'audio-capture': 'No microphone found. Please connect a microphone.',
  'network': 'Network error during speech recognition.',
  'aborted': 'Listening was stopped.',
  'service-not-allowed': 'Speech recognition service not allowed.',
};

interface Props {
  transcript: string;
  interimTranscript: string;
  detectedWords: string[];
  isListening: boolean;
  error: string | null;
}

export function TranscriptPanel({ transcript, interimTranscript, detectedWords, isListening, error }: Props) {
  const displayTranscript = transcript.slice(-100);

  return (
    <div className="bg-gray-100 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-sm font-medium text-gray-600">
          {isListening ? '🎤 Listening...' : '🎤 Paused'}
        </span>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{ERROR_MESSAGES[error] ?? `Error: ${error}`}</p>
      ) : (
        <div className="text-sm text-gray-600 min-h-[40px] mb-2">
          <span className="text-gray-800">{displayTranscript || 'Waiting for speech...'}</span>
          <span className="text-gray-400 italic">{interimTranscript}</span>
        </div>
      )}

      {detectedWords.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">Detected:</span>
          {detectedWords.slice(-5).map((word, i) => (
            <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              ✨ {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
