// Web Speech API interface for Indonesian (id-ID) speech recognition

export interface SpeechRecognitionHookResult {
  isSupported: boolean;
  isListening: boolean;
  startListening: (onResult: (text: string) => void, onError?: (err: string) => void) => void;
  stopListening: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function createSpeechRecognizer(
  onTranscript: (text: string) => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();
  recognition.lang = 'id-ID';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0]?.[0]?.transcript || '';
    if (transcript) {
      onTranscript(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
