# Voice Commands Integration

This document describes the ElevenLabs voice command integration added to the application.

## Overview

The application now includes voice command functionality that allows users to speak their requests instead of typing them. The integration includes:

- **Voice Recording**: Capture audio from the user's microphone
- **Speech-to-Text**: Convert spoken words to text
- **ElevenLabs Integration**: Optional API key configuration for enhanced features
- **Web Speech API Fallback**: Browser-native speech recognition as backup

## Features

### 🎤 Voice Recording
- One-click recording start/stop
- Visual feedback during recording (pulsing indicator)
- Automatic microphone permission handling
- High-quality audio capture with noise suppression

### 🧠 Speech Recognition
- **Primary**: Web Speech API (browser-native)
- **Optional**: ElevenLabs API integration (for future enhancements)
- Real-time transcription processing
- Error handling and fallback mechanisms

### 🔧 Configuration
- Optional ElevenLabs API key management
- Secure local storage of API credentials
- Visual status indicators for configuration state

## File Structure

```
src/
├── components/
│   └── VoiceCommand.tsx          # Main voice command UI component
├── hooks/
│   └── useVoiceRecording.ts      # Custom hook for voice recording logic
└── utils/
    └── elevenlabs.ts             # ElevenLabs API integration utilities
```

## Components

### VoiceCommand Component
Located at `src/components/VoiceCommand.tsx`

**Props:**
- `onTranscript: (transcript: string) => void` - Callback when speech is transcribed
- `disabled?: boolean` - Disable the voice command interface

**Features:**
- API key configuration interface
- Recording button with state management
- Status messages and error handling
- Transcript preview and confirmation

### useVoiceRecording Hook
Located at `src/hooks/useVoiceRecording.ts`

**Returns:**
- `isRecording: boolean` - Current recording state
- `isProcessing: boolean` - Speech processing state
- `error: string | null` - Error messages
- `transcript: string | null` - Transcribed text
- `startRecording: () => Promise<void>` - Start recording function
- `stopRecording: () => Promise<void>` - Stop recording function
- `clearTranscript: () => void` - Clear transcript function

## Usage

### Basic Integration
The voice command component is already integrated into the main page:

```tsx
<VoiceCommand 
  onTranscript={handleVoiceTranscript}
  disabled={isSubmitting || isProcessing}
/>
```

### Handling Transcripts
```tsx
const handleVoiceTranscript = (transcript: string) => {
  setInput(transcript); // Populate the text input with transcribed text
};
```

## API Configuration

### ElevenLabs API Key (Optional)
1. Click "Add API Key (Optional)" in the voice command section
2. Enter your ElevenLabs API key
3. Click "Save" to store it securely in localStorage

**Note**: ElevenLabs primarily focuses on Text-to-Speech, not Speech-to-Text. The current implementation uses Web Speech API as the primary transcription method, with ElevenLabs integration prepared for future enhancements.

### Web Speech API
The application uses the browser's native Web Speech API as the primary speech recognition method. This provides:
- No additional API keys required
- Good accuracy for English speech
- Cross-browser compatibility
- Real-time processing

## Browser Compatibility

### Supported Browsers
- **Chrome**: Full support
- **Edge**: Full support  
- **Safari**: Limited support (webkitSpeechRecognition)
- **Firefox**: Limited support

### Requirements
- HTTPS connection (required for microphone access)
- Microphone permissions granted
- Modern browser with Web Speech API support

## Error Handling

The integration includes comprehensive error handling for:

- **Microphone Access**: Permission denied or unavailable
- **Speech Recognition**: Browser compatibility issues
- **Network Errors**: API connectivity problems
- **Audio Processing**: Recording or transcription failures

## Security Considerations

- API keys are stored in localStorage (client-side only)
- Microphone access requires explicit user permission
- No audio data is stored permanently
- HTTPS required for production deployment

## Future Enhancements

### Planned Features
1. **Real ElevenLabs STT**: Integration with actual Speech-to-Text service
2. **Multiple Languages**: Support for non-English speech recognition
3. **Voice Commands**: Predefined voice commands for common actions
4. **Audio Feedback**: Text-to-speech confirmation of transcribed text
5. **Offline Support**: Local speech recognition capabilities

### Technical Improvements
1. **Audio Compression**: Optimize audio file sizes
2. **Streaming Recognition**: Real-time transcription during recording
3. **Custom Models**: Fine-tuned speech recognition models
4. **Voice Training**: User-specific voice recognition improvements

## Troubleshooting

### Common Issues

**"Speech recognition not supported"**
- Ensure you're using a supported browser (Chrome/Edge recommended)
- Check that you're on HTTPS (required for microphone access)

**"Failed to access microphone"**
- Grant microphone permissions in browser settings
- Check if another application is using the microphone
- Ensure microphone hardware is working

**"Speech recognition error"**
- Check internet connection (Web Speech API requires connectivity)
- Try speaking more clearly and slowly
- Ensure quiet environment for better recognition

### Debug Mode
Enable browser developer tools to see detailed error messages and API responses.

## Dependencies

The voice command integration uses the following packages:

```json
{
  "@elevenlabs/elevenlabs-js": "^latest",
  "mic-recorder-to-mp3": "^latest"
}
```

## Performance Notes

- Audio recording uses efficient WebM format
- Processing happens asynchronously to avoid UI blocking
- Memory usage is optimized with automatic cleanup
- Network requests are minimized with smart caching

---

For technical support or feature requests, please refer to the main project documentation.