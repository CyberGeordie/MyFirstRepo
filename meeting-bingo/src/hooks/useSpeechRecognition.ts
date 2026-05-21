import { useState, useEffect, useCallback, useRef } from 'react';
import type { SpeechRecognitionState } from '../types';

const SpeechRecognitionAPI =
  (window as Window & typeof globalThis & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
    .SpeechRecognition ??
  (window as Window & typeof globalThis & { webkitSpeechRecognition?: typeof SpeechRecognition })
    .webkitSpeechRecognition ??
  null;

export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechRecognitionState>({
    isSupported: !!SpeechRecognitionAPI,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultCallback = useRef<((transcript: string) => void) | null>(null);
  // Prevents infinite restart loop on permission-denied / fatal errors
  const shouldRestart = useRef(false);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setState(prev => ({
        ...prev,
        transcript: prev.transcript + final,
        interimTranscript: interim,
      }));

      if (final && onResultCallback.current) {
        onResultCallback.current(final);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      shouldRestart.current = false;
      setState(prev => ({ ...prev, error: event.error, isListening: false }));
    };

    recognition.onend = () => {
      if (shouldRestart.current) {
        try {
          recognition.start();
        } catch {
          // already running
        }
      }
    };

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const startListening = useCallback((onResult?: (transcript: string) => void) => {
    if (!recognitionRef.current) return;
    onResultCallback.current = onResult ?? null;
    shouldRestart.current = true;
    setState(prev => ({ ...prev, isListening: true, transcript: '', interimTranscript: '', error: null }));
    try {
      recognitionRef.current.start();
    } catch {
      // already running
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldRestart.current = false;
    setState(prev => ({ ...prev, isListening: false }));
    recognitionRef.current.stop();
    onResultCallback.current = null;
  }, []);

  const resetTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  return { ...state, startListening, stopListening, resetTranscript };
}
