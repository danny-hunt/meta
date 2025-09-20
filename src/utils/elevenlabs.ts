// ElevenLabs Speech-to-Text Integration
// Note: ElevenLabs primarily focuses on Text-to-Speech, not Speech-to-Text
// This implementation provides a fallback to Web Speech API with ElevenLabs branding

import { ElevenLabsConfig, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types/voice';

export class ElevenLabsSTT {
  private apiKey: string;
  private modelId: string;

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    this.modelId = config.modelId || 'eleven_multilingual_v2';
  }

  // Note: ElevenLabs doesn't have a direct Speech-to-Text API
  // This is a placeholder for future integration or custom backend
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    // For now, we'll use Web Speech API as ElevenLabs doesn't offer STT
    // In a production environment, you would need to:
    // 1. Use a different STT service (Google Cloud, Azure, AWS)
    // 2. Set up a backend proxy to ElevenLabs TTS
    // 3. Use ElevenLabs for voice synthesis after STT processing
    
    console.log('ElevenLabs STT: Using Web Speech API fallback');
    return this.transcribeWithWebSpeech(audioBlob);
  }

  // Alternative method using Web Speech API as fallback
  async transcribeWithWebSpeech(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      recognition.onend = () => {
        // Recognition ended
      };
      
      recognition.start();
    });
  }
}

// Utility function to check if ElevenLabs API key is available
export function hasElevenLabsKey(): boolean {
  // First check environment variable (server-side or client-side with Next.js)
  const envKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  if (envKey && envKey !== 'your_elevenlabs_api_key_here') {
    return true;
  }
  
  // Fallback to localStorage for client-side
  return typeof window !== 'undefined' && !!localStorage.getItem('elevenlabs_api_key');
}

// Utility function to get ElevenLabs API key from environment or localStorage
export function getElevenLabsKey(): string | null {
  // First check environment variable (server-side or client-side with Next.js)
  const envKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  if (envKey && envKey !== 'your_elevenlabs_api_key_here') {
    return envKey;
  }
  
  // Fallback to localStorage for client-side
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('elevenlabs_api_key');
}

// Utility function to set ElevenLabs API key in localStorage
export function setElevenLabsKey(apiKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('elevenlabs_api_key', apiKey);
  }
}