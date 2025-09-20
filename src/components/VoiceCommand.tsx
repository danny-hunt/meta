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
    if (isRecording) return 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700';
    if (isProcessing) return 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700';
    return 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700';
  };

  return (
    <div className="space-y-3">
      {/* ElevenLabs API Key Configuration */}
      <div className="text-xs text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-blue-800">ElevenLabs API Key:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isApiKeyValid ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className={isApiKeyValid ? 'text-green-700 font-medium' : 'text-gray-600'}>
              {isApiKeyValid ? (isEnvKey() ? 'From .env' : 'Configured') : 'Not Set'}
            </span>
          </div>
        </div>
        
        {!isApiKeyValid && (
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Add API Key (Optional)
          </button>
        )}
        
        {isApiKeyValid && (
          <button
            onClick={handleApiKeyClear}
            className="text-red-600 hover:text-red-800 underline font-medium"
          >
            Clear API Key
          </button>
        )}
      </div>

      {/* API Key Input */}
      {showApiKeyInput && (
        <div className="space-y-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter ElevenLabs API Key"
            className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleApiKeySubmit}
              className="px-2 py-1 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded hover:from-blue-700 hover:to-indigo-700 font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="px-2 py-1 text-xs bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded hover:from-gray-700 hover:to-gray-800 font-medium"
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
        className={`w-full py-3 px-4 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transform hover:scale-105 transition-all duration-200 ${getButtonColor()}`}
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
        <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border border-red-300 rounded-lg text-xs shadow-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isRecording && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-300 rounded-lg text-xs shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Listening... Speak now</span>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-800 border border-yellow-300 rounded-lg text-xs shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full animate-spin"></div>
            <span className="font-medium">Processing your speech...</span>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="space-y-2">
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-300 rounded-lg text-xs shadow-md">
            <strong>Transcribed:</strong> {transcript}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleTranscript(transcript)}
              className="px-3 py-1 text-xs bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded hover:from-green-700 hover:to-emerald-700 font-medium"
            >
              Use This Text
            </button>
            <button
              onClick={clearTranscript}
              className="px-3 py-1 text-xs bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded hover:from-gray-700 hover:to-gray-800 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50 p-2 rounded-lg border border-gray-200">
        <p>💡 <strong>Tip:</strong> {isApiKeyValid ? 
          (isEnvKey() ? 'Using ElevenLabs API key from .env file' : 'Using ElevenLabs for high-quality transcription') : 
          'Using browser speech recognition (add API key for better accuracy)'}</p>
      </div>
    </div>
  );
}