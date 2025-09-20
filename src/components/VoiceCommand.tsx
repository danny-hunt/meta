"use client";

import { useState } from 'react';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { getElevenLabsKey, setElevenLabsKey, hasElevenLabsKey } from '../utils/elevenlabs';
import { VoiceCommandProps } from '../types/voice';

export default function VoiceCommand({ onTranscript, disabled = false }: VoiceCommandProps) {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(getElevenLabsKey() || '');
  const [isApiKeyValid, setIsApiKeyValid] = useState(hasElevenLabsKey());
  
  // Check if API key is from environment variables
  const isEnvKey = () => {
    const envKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    return envKey && envKey !== 'your_elevenlabs_api_key_here';
  };
  
  const {
    isRecording,
    isProcessing,
    error,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useVoiceRecording();

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setElevenLabsKey(apiKey.trim());
      setIsApiKeyValid(true);
      setShowApiKeyInput(false);
    }
  };

  const handleApiKeyClear = () => {
    localStorage.removeItem('elevenlabs_api_key');
    setApiKey('');
    setIsApiKeyValid(false);
    setShowApiKeyInput(false);
  };

  const handleTranscript = (text: string) => {
    onTranscript(text);
    clearTranscript();
  };

  const getButtonText = () => {
    if (isRecording) return 'Stop Recording';
    if (isProcessing) return 'Processing...';
    return 'Start Voice Command';
  };

  const getButtonColor = () => {
    if (isRecording) return 'bg-red-600 hover:bg-red-700';
    if (isProcessing) return 'bg-yellow-600 hover:bg-yellow-700';
    return 'bg-green-600 hover:bg-green-700';
  };

  return (
    <div className="space-y-3">
      {/* ElevenLabs API Key Configuration */}
      <div className="text-xs text-gray-600">
        <div className="flex items-center justify-between mb-2">
          <span>ElevenLabs API Key:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isApiKeyValid ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className={isApiKeyValid ? 'text-green-600' : 'text-gray-500'}>
              {isApiKeyValid ? (isEnvKey() ? 'From .env' : 'Configured') : 'Not Set'}
            </span>
          </div>
        </div>
        
        {!isApiKeyValid && (
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Add API Key (Optional)
          </button>
        )}
        
        {isApiKeyValid && (
          <button
            onClick={handleApiKeyClear}
            className="text-red-600 hover:text-red-800 underline"
          >
            Clear API Key
          </button>
        )}
      </div>

      {/* API Key Input */}
      {showApiKeyInput && (
        <div className="space-y-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter ElevenLabs API Key"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleApiKeySubmit}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Voice Recording Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${getButtonColor()}`}
      >
        <div className="flex items-center justify-center space-x-2">
          {isRecording && (
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          )}
          <span>{getButtonText()}</span>
        </div>
      </button>

      {/* Status Messages */}
      {error && (
        <div className="p-2 bg-red-50 text-red-800 border border-red-200 rounded text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isRecording && (
        <div className="p-2 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>Listening... Speak now</span>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="p-2 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-600 rounded-full animate-spin"></div>
            <span>Processing your speech...</span>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="space-y-2">
          <div className="p-2 bg-green-50 text-green-800 border border-green-200 rounded text-xs">
            <strong>Transcribed:</strong> {transcript}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleTranscript(transcript)}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              Use This Text
            </button>
            <button
              onClick={clearTranscript}
              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        <p>💡 <strong>Tip:</strong> {isApiKeyValid ? 
          (isEnvKey() ? 'Using ElevenLabs API key from .env file' : 'Using ElevenLabs for high-quality transcription') : 
          'Using browser speech recognition (add API key for better accuracy)'}</p>
      </div>
    </div>
  );
}