declare module 'react-speech-recognition' {
  export interface SpeechRecognition {
    startListening: (options?: { continuous?: boolean; language?: string }) => Promise<void>;
    stopListening: () => Promise<void>;
    abortListening: () => Promise<void>;
    browserSupportsSpeechRecognition: boolean;
  }

  export interface useSpeechRecognitionOptions {
    transcribing?: boolean;
    clearTranscriptOnListen?: boolean;
    commands?: {
      command: string | string[] | RegExp;
      callback: (...args: any[]) => void;
      isFuzzyMatch?: boolean;
      matchInterim?: boolean;
      fuzzyMatchingThreshold?: number;
      bestMatchOnly?: boolean;
    }[];
  }

  export const useSpeechRecognition: (options?: useSpeechRecognitionOptions) => {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
    isMicrophoneAvailable: boolean;
  };

  const SpeechRecognition: SpeechRecognition;
  export default SpeechRecognition;
}
