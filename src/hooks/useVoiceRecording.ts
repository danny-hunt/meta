"use client";

import { useState, useRef, useCallback } from 'react';
import { VoiceRecordingState, VoiceRecordingReturn } from '../types/voice';

export const useVoiceRecording = (): VoiceRecordingReturn => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    transcript: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, transcript: null }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length > 0) {
          setState(prev => ({ ...prev, isProcessing: true }));
          
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const transcript = await processAudioWithElevenLabs(audioBlob);
            setState(prev => ({ 
              ...prev, 
              transcript, 
              isProcessing: false 
            }));
          } catch (error) {
            setState(prev => ({ 
              ...prev, 
              error: error instanceof Error ? error.message : 'Failed to process audio',
              isProcessing: false 
            }));
          }
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState(prev => ({ ...prev, isRecording: true }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to access microphone',
        isRecording: false 
      }));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false }));
    }
  }, [state.isRecording]);

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: null, error: null }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearTranscript,
  };
};

// Function to process audio with ElevenLabs Speech-to-Text
async function processAudioWithElevenLabs(audioBlob: Blob): Promise<string> {
  // Try ElevenLabs API first if API key is available
  const apiKey = localStorage.getItem('elevenlabs_api_key');
  
  if (apiKey) {
    try {
      const { ElevenLabsSTT } = await import('../utils/elevenlabs');
      const stt = new ElevenLabsSTT({ apiKey });
      return await stt.transcribeAudio(audioBlob);
    } catch (error) {
      console.warn('ElevenLabs API failed, falling back to Web Speech API:', error);
    }
  }
  
  // Fallback to Web Speech API
  const { ElevenLabsSTT } = await import('../utils/elevenlabs');
  const stt = new ElevenLabsSTT({ apiKey: '' });
  return await stt.transcribeWithWebSpeech(audioBlob);
}