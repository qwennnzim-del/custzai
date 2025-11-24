import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { CloseIcon, LiveIcon, HistoryIcon, CameraIcon, UploadIcon, PauseIcon } from './Icons';

// Fix for "Cannot find name 'process'" error during build
declare const process: any;

interface LiveVoiceViewProps {
  onClose: () => void;
  onSend: (transcribedText: string) => void;
}

// Helper functions for base64 encoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] < 0 ? data[i] * 32768 : data[i] * 32767;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveVoiceView: React.FC<LiveVoiceViewProps> = ({ onClose, onSend }) => {
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const finalTranscriptionRef = useRef('');

  const handleClose = () => {
    onSend(finalTranscriptionRef.current);
  };
  
  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let sessionClosed = false;
    
    const startListening = async () => {
      try {
        if (!process.env.API_KEY) {
            throw new Error("API Key is not configured.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = audioContext.createMediaStreamSource(mediaStream!);
                    scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        if (sessionClosed) return;
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then((session) => {
                          if (!sessionClosed) {
                            session.sendRealtimeInput({ media: pcmBlob });
                          }
                        });
                    };

                    source.connect(scriptProcessor);
                    scriptProcessor.connect(audioContext.destination);
                },
                onmessage: (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        finalTranscriptionRef.current += text;
                        setTranscription(finalTranscriptionRef.current);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setError('A connection error occurred.');
                },
                onclose: (e: CloseEvent) => {
                    console.log('Live session closed.');
                    sessionClosed = true;
                },
            },
            config: {
                inputAudioTranscription: {},
                responseModalities: [Modality.AUDIO], // FIX: Added required modality
            },
        });
        
        sessionPromise.catch(err => {
            console.error("Failed to connect live session", err);
            setError("Failed to start listening. Please check permissions.");
        });

      } catch (err) {
        console.error('Error starting voice session:', err);
        setError('Could not access microphone. Please grant permission and try again.');
      }
    };

    startListening();

    return () => {
        sessionClosed = true;
        mediaStream?.getTracks().forEach(track => track.stop());
        scriptProcessor?.disconnect();
        audioContext?.close().catch(console.error);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-sans overflow-hidden">
      {/* Background blur effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[60%] bg-gradient-radial from-blue-900/30 via-transparent to-transparent blur-3xl opacity-50" />
      
      {/* Header */}
      <header className="flex justify-between items-center p-6 text-white z-10">
        <div className="flex items-center gap-2">
          <LiveIcon className="w-6 h-6" />
          <span className="font-medium text-lg">Live</span>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full">
          <HistoryIcon className="w-6 h-6" />
        </button>
      </header>
      
      {/* Transcription Display */}
      <main className="flex-grow flex items-center justify-center p-8 z-10">
        <p className="text-white/80 text-3xl font-medium text-center leading-relaxed">
          {error || transcription || 'Listening...'}
        </p>
      </main>

      {/* Controls */}
      <footer className="flex justify-center items-center p-6 gap-4 z-10">
          <div className="flex items-center gap-4 bg-gray-900/50 backdrop-blur-lg p-3 rounded-full">
              <button className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"><CameraIcon className="w-6 h-6" /></button>
              <button className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"><UploadIcon className="w-6 h-6" /></button>
              <button className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"><PauseIcon className="w-6 h-6" /></button>
          </div>
          <button onClick={handleClose} className="bg-red-600 rounded-full p-4 hover:bg-red-500 transition-colors">
            <CloseIcon className="w-7 h-7 text-white" />
          </button>
      </footer>
    </div>
  );
};

export default LiveVoiceView;