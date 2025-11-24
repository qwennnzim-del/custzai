import React, { useState, useEffect, useRef } from 'react';
import { Message, AspectRatio } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { HeartIcon, CopyIcon, CheckIcon, ShareIcon, PlayIcon, StopIcon, SpinnerIcon, SparklesIcon, DownloadIcon, EditIcon, CusstzzLogo, GlobeIcon, CodeIcon, CloseIcon, BrainIcon, ChevronDownIcon } from './Icons';

interface FinalBotMessageProps {
  message: Message;
  onStageImageForEditing: (imageUrl: string) => void;
  onSendMessage: (text: string) => void;
}

// Helper functions for audio decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ShimmerPlaceholder: React.FC = () => (
    <div className="space-y-3 mt-2">
        <div className="h-4 bg-gray-700 rounded w-3/4 shimmer-bg"></div>
        <div className="h-4 bg-gray-700 rounded w-full shimmer-bg"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6 shimmer-bg"></div>
    </div>
);

const ImageLoadingPlaceholder: React.FC<{ aspectRatio: AspectRatio; statusText?: string }> = ({ aspectRatio, statusText }) => {
    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case '1:1': return 'aspect-square';
            case '16:9': return 'aspect-video';
            case '9:16': return 'aspect-[9/16]';
            case '4:3': return 'aspect-[4/3]';
            case '3:4': return 'aspect-[3/4]';
            default: return 'aspect-square';
        }
    };

    return (
        <div className={`relative mt-2 w-full max-w-md ${getAspectRatioClass()} bg-gray-900/50 border border-gray-700/50 rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all duration-300`}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-blue-900/30 animate-gradient"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center text-gray-400 px-4">
                <SparklesIcon className="w-10 h-10 mb-3 text-blue-400 opacity-80 animate-[pulse-icon_3s_ease-in-out_infinite]" />
                <p className="font-medium text-gray-300 animate-pulse">{statusText || 'Generating image...'}</p>
                <p className="text-xs text-gray-500 mt-1">Using CustzPro Engine</p>
            </div>
        </div>
    );
};

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean }> = ({ onClick, children, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all duration-200 transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
    >
        {children}
    </button>
);

const ArtifactModal: React.FC<{ code: string; onClose: () => void }> = ({ code, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-[#1A1A1A] w-full h-[85vh] max-w-6xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-[#121212]">
                    <div className="flex items-center gap-2">
                        <span className="flex gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                        </span>
                        <span className="ml-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Custz Artifact Preview</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-grow bg-white relative">
                    <iframe 
                        srcDoc={code}
                        className="w-full h-full border-none"
                        title="Preview"
                        sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                    />
                </div>
             </div>
        </div>
    );
};

const ThinkingDisclosure: React.FC<{ thinkingText: string; isStreaming: boolean }> = ({ thinkingText, isStreaming }) => {
  const [isOpen, setIsOpen] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of thought stream
  useEffect(() => {
    if (isOpen && terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [thinkingText, isOpen]);

  // Split thoughts into paragraphs/lines for rendering
  const paragraphs = thinkingText.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="mb-6 rounded-lg overflow-hidden border border-purple-900/40 bg-[#000000] shadow-2xl animate-fade-in ring-1 ring-purple-900/50 group">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-[#101010] hover:bg-[#181818] transition-colors border-b border-purple-900/20"
        >
            <div className="flex items-center gap-2">
                <div className={`p-1 rounded bg-purple-900/20 text-purple-400 ${isStreaming ? 'animate-pulse' : ''}`}>
                   <BrainIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-purple-400 font-mono tracking-widest uppercase">Logic Terminal</span>
                {isStreaming && (
                    <span className="flex h-2 w-2 relative ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                 <span className="text-[10px] text-gray-600 font-mono">
                    {thinkingText.length > 0 ? `${thinkingText.length} TOKENS` : 'IDLE'}
                 </span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
        </button>
        <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
            <div 
                ref={terminalRef}
                className="p-4 bg-black font-mono text-xs leading-relaxed overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-black"
            >
                {paragraphs.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {paragraphs.map((line, index) => (
                             <div key={index} className="flex gap-2 animate-fade-in-text">
                                <span className="text-purple-500 shrink-0 select-none">{'>'}</span>
                                <span className="text-green-500/90 font-mono break-words whitespace-pre-wrap">{line}</span>
                             </div>
                        ))}
                        {isStreaming && (
                            <div className="flex gap-2 animate-pulse mt-1">
                                <span className="text-purple-500 select-none">{'>'}</span>
                                <span className="inline-block w-2 h-4 bg-green-500 align-middle"></span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 text-gray-500 opacity-80">
                         <div className="flex items-center gap-2">
                             <span className="text-purple-500">{'>'}</span>
                             <span>INITIALIZING LOGIC KERNEL...</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-purple-500">{'>'}</span>
                             <span>ALLOCATING REASONING TOKENS...</span>
                         </div>
                         <div className="flex items-center gap-2 animate-pulse text-green-500">
                             <span className="text-purple-500">{'>'}</span>
                             <span>AWAITING MODEL THOUGHT STREAM...</span>
                             <span className="inline-block w-2 h-4 bg-green-500 ml-1"></span>
                         </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

const FinalBotMessage: React.FC<FinalBotMessageProps> = ({ message, onStageImageForEditing, onSendMessage }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [showArtifact, setShowArtifact] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Cleanup audio context and source on component unmount
    return () => {
      audioSourceRef.current?.stop();
      audioContextRef.current?.close().catch(console.error);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleDownload = () => {
    if (!message.imageUrl) return;
    const link = document.createElement('a');
    link.href = message.imageUrl;
    link.download = `CustzAI-${Date.now()}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleEdit = () => {
    if (message.imageUrl) {
        onStageImageForEditing(message.imageUrl);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    if (isTtsLoading) return;
    
    setIsTtsLoading(true);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key not found.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: message.text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Natural, human-like voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setIsPlaying(false);
          audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error generating or playing speech:", error);
    } finally {
      setIsTtsLoading(false);
    }
  };

  const finalAnswerHtml = (message.text && !message.imageUrl) 
    ? (typeof window.marked?.parse === 'function' ? window.marked.parse(message.text) : `<p>${message.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    : '';

  // Extract grounding (sources)
  const sources = message.groundingMetadata?.groundingChunks?.map((chunk: any, index: number) => {
      if (chunk.web) {
          return {
              type: 'web',
              title: chunk.web.title || 'Web Source',
              uri: chunk.web.uri,
              id: index
          };
      }
      if (chunk.maps) {
           return {
              type: 'maps',
              title: chunk.maps.title || 'Maps Location',
              uri: chunk.maps.uri,
              id: index
          };
      }
      return null;
  }).filter(Boolean) || [];

  // Detect HTML for Artifact Preview
  // Looking for blocks like ```html ... ```
  const extractedHtml = message.text.match(/```html([\s\S]*?)```/)?.[1];

  return (
    <div className="flex gap-4 items-start my-6 relative animate-fade-in-up">
      <CusstzzLogo className="w-8 h-8 rounded-full flex-shrink-0 mt-2" />
      <div className="w-full max-w-xl">
        {/* Updated Name Header with Status Text */}
        <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-200">CustzAI</p>
            {message.statusText && (
                <span className="text-xs text-blue-400 font-medium animate-pulse bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {message.statusText}
                </span>
            )}
        </div>

        {/* CoT Thinking Box (Displayed if isThinkingMode is true OR thinkingText exists) */}
        {(message.isThinkingMode || message.thinkingText) && (
            <ThinkingDisclosure 
                thinkingText={message.thinkingText || ''} 
                isStreaming={!!message.isStreaming}
            />
        )}
        
        {message.isStreaming && message.aspectRatio ? (
            <div>
              <ImageLoadingPlaceholder aspectRatio={message.aspectRatio} statusText={message.statusText} />
            </div>
        ) : message.imageUrl ? (
          <div className="mt-2">
            <img src={message.imageUrl} alt={message.text} className="rounded-lg border border-gray-700/50 shadow-lg" />
            <p className="text-sm text-gray-400 mt-2 italic border-l-2 border-gray-600 pl-3">{message.text}</p>
          </div>
        ) : message.isStreaming && !message.text && !message.thinkingText ? (
            <ShimmerPlaceholder />
        ) : (
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: finalAnswerHtml }}
          />
        )}
        
        {/* Artifact Preview Button */}
        {!message.isStreaming && extractedHtml && (
             <button
                onClick={() => setShowArtifact(true)}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0D0D0D] bg-gradient-to-r from-[#00c6ff] to-[#00eaff] rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,198,255,0.4)] group animate-fade-in-up"
             >
                <CodeIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>⚡ Run Live Preview</span>
             </button>
        )}
        
        {/* Sources / Grounding Display */}
        {!message.isStreaming && sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-800">
                <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                    <GlobeIcon className="w-3 h-3" /> SOURCES
                </p>
                <div className="flex flex-wrap gap-2">
                    {sources.map((source: any) => (
                        <a 
                            key={source.id} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-2 py-1 rounded border border-gray-700 transition-colors max-w-full truncate"
                        >
                            {source.title}
                        </a>
                    ))}
                </div>
            </div>
        )}

        {/* Action Buttons */}
        {!message.isStreaming && (message.text || message.imageUrl) && (
            <div className="flex items-center gap-2 mt-3">
                <ActionButton onClick={() => setIsLiked(!isLiked)}>
                    <HeartIcon className={`w-5 h-5 transition-colors ${isLiked ? 'liked-heart' : ''}`} />
                </ActionButton>
                <ActionButton onClick={handleCopy}>
                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                </ActionButton>
                <ActionButton onClick={handleCopy}>
                    <ShareIcon className="w-5 h-5" />
                </ActionButton>
                {message.imageUrl && (
                  <>
                    <ActionButton onClick={handleDownload}>
                        <DownloadIcon className="w-5 h-5" />
                    </ActionButton>
                    <ActionButton onClick={handleEdit}>
                        <EditIcon className="w-5 h-5" />
                    </ActionButton>
                  </>
                )}
                {!message.imageUrl && (
                  <ActionButton onClick={handlePlayPause} disabled={isTtsLoading}>
                      {isTtsLoading ? (
                          <SpinnerIcon className="w-5 h-5 animate-spin" />
                      ) : isPlaying ? (
                          <StopIcon className="w-5 h-5" />
                      ) : (
                          <PlayIcon className="w-5 h-5" />
                      )}
                  </ActionButton>
                )}
            </div>
        )}
        
        {/* Suggestions Chips */}
        {!message.isStreaming && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
                {message.suggestions.map((suggestion, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSendMessage(suggestion)}
                        className="px-4 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/60 border border-gray-700 rounded-full hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-300 hover:shadow-[0_0_10px_rgba(100,100,255,0.2)]"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        )}
      </div>
      
      {showArtifact && extractedHtml && (
        <ArtifactModal code={extractedHtml} onClose={() => setShowArtifact(false)} />
      )}
    </div>
  );
};

export default FinalBotMessage;