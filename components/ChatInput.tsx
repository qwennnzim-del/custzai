import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, SendIcon, VoiceIcon, CloseIcon, SparklesIcon, SpinnerIcon, FileIcon, GlobeIcon, BrainIcon, LightningIcon } from './Icons';
import { ModelType } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onVoiceClick: () => void;
  onFileChange: (file: File) => void;
  stagedFile: { url: string; file: File } | null;
  clearStagedFile: () => void;
  model: ModelType;
  isSearchEnabled: boolean;
  onToggleSearch: () => void;
  isThinkingEnabled?: boolean;
  onToggleThinking?: () => void;
  isTurboEnabled?: boolean;
  onToggleTurbo?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, 
    isLoading, 
    onVoiceClick,
    onFileChange,
    stagedFile,
    clearStagedFile,
    model,
    isSearchEnabled,
    onToggleSearch,
    isThinkingEnabled,
    onToggleThinking,
    isTurboEnabled,
    onToggleTurbo
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);

  // Reset enhanced state when user types manually
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (isEnhanced) setIsEnhanced(false);
  };

  const handleSend = () => {
    if ((inputValue.trim() || stagedFile) && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
      setIsEnhanced(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!inputValue.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
        if (!process.env.API_KEY) throw new Error("API Key not found");
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // Use Flash Lite with Zero Thinking Budget for instant enhancement
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            config: { thinkingConfig: { thinkingBudget: 0 } },
            contents: `Rewrite the following user prompt to be comprehensive, detailed, and optimized for an AI Large Language Model to get the best possible result. Keep the original intent but expand on it. Do not add any preamble or conversational text, just output the enhanced prompt directly.
            
            User Prompt: "${inputValue}"`,
        });

        if (response.text) {
            setInputValue(response.text.trim());
            setIsEnhanced(true);
        }
    } catch (error) {
        console.error("Failed to enhance prompt:", error);
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
    // Reset file input value to allow selecting the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const placeholderText = stagedFile 
    ? "Describe the attachment or ask a question..." 
    : "Message CustzAI...";

  const isFileUploadDisabled = model === 'imagen-4.0-generate-001';
  
  // Supported features based on model
  const isChatModel = ['gemini-2.5-flash', 'gemini-3-pro-preview', 'gemini-flash-lite-latest', 'gemini-1.5-flash'].includes(model);
  // Thinking Config is ONLY supported by 2.5 Flash, 3 Pro, and Lite. NOT 1.5 Flash.
  const isThinkingSupported = ['gemini-2.5-flash', 'gemini-3-pro-preview', 'gemini-flash-lite-latest'].includes(model);

  const isImage = stagedFile?.file.type.startsWith('image/');

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00c6ff] via-[#8a2be2] to-[#00eaff] rounded-[22px] blur-xl opacity-60 animate-gradient transition-opacity duration-300"></div>
      
      {/* Main input container */}
      <div className="relative flex flex-col p-3 bg-[#1A1A1A] rounded-[20px] border border-gray-700/50">
        {stagedFile && (
            <div className="relative self-start mb-2 p-1.5 border border-gray-600 rounded-lg bg-gray-800 flex items-center gap-3 pr-8">
                {isImage ? (
                    <img src={stagedFile.url} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-gray-700 rounded-md">
                        <FileIcon className="w-8 h-8 text-gray-400" />
                    </div>
                )}
                
                <div className="max-w-[150px]">
                    <p className="text-xs text-gray-300 truncate font-medium">{stagedFile.file.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{stagedFile.file.type.split('/')[1] || 'FILE'}</p>
                </div>

                <button 
                  onClick={clearStagedFile} 
                  className="absolute -top-2 -right-2 bg-gray-800 border border-gray-600 rounded-full p-1 text-white hover:bg-gray-700 shadow-md"
                  aria-label="Remove attachment"
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className="w-full px-2 py-2 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none resize-none max-h-40 overflow-y-auto"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
              {/* Search Toggle */}
              <button 
                onClick={onToggleSearch}
                disabled={!isChatModel}
                className={`p-2 transition-all duration-300 rounded-full hover:bg-gray-700/50 group relative
                    ${!isChatModel ? 'opacity-30 cursor-not-allowed' : ''}
                    ${isSearchEnabled && isChatModel ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white'}
                `}
                title={isChatModel ? "Toggle Google Search" : "Search unavailable"}
              >
                  {isSearchEnabled && isChatModel && (
                      <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping opacity-75"></span>
                  )}
                  <GlobeIcon className={`w-5 h-5 transition-transform duration-300 ${isSearchEnabled && isChatModel ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`} />
              </button>

              {/* CoT (Thinking) Toggle */}
              <button 
                onClick={onToggleThinking}
                disabled={!isThinkingSupported}
                className={`p-2 transition-all duration-300 rounded-full hover:bg-gray-700/50 group relative
                    ${!isThinkingSupported ? 'opacity-30 cursor-not-allowed' : ''}
                    ${isThinkingEnabled && isThinkingSupported ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400 hover:text-white'}
                `}
                title={isThinkingSupported ? "Enable CoT (Deep Thinking)" : "CoT unavailable for this model"}
              >
                  {isThinkingEnabled && isThinkingSupported && (
                      <span className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping opacity-75"></span>
                  )}
                  <BrainIcon className={`w-5 h-5 transition-transform duration-300 ${isThinkingEnabled ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''}`} />
              </button>

              {/* Turbo Zero Toggle */}
              <button 
                onClick={onToggleTurbo}
                disabled={!isThinkingSupported}
                className={`p-2 transition-all duration-300 rounded-full hover:bg-gray-700/50 group relative
                    ${!isThinkingSupported ? 'opacity-30 cursor-not-allowed' : ''}
                    ${isTurboEnabled && isThinkingSupported ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-400 hover:text-white'}
                `}
                title={isThinkingSupported ? "Enable Turbo Zero (Instant Answer)" : "Turbo unavailable for this model"}
              >
                  {isTurboEnabled && isThinkingSupported && (
                      <span className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping opacity-75"></span>
                  )}
                  <LightningIcon className={`w-5 h-5 transition-transform duration-300 ${isTurboEnabled ? 'scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]' : ''}`} />
              </button>

              {/* Prompt Enhancer */}
              <button 
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !inputValue.trim()}
                className={`p-2 transition-colors rounded-full hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed ${isEnhanced ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                title="Enhance Prompt with AI"
              >
                  {isEnhancing ? (
                    <SpinnerIcon className="w-5 h-5 animate-spin text-blue-400" />
                  ) : (
                    <SparklesIcon className={`w-5 h-5 ${isEnhanced ? 'fill-yellow-400/20' : ''}`} />
                  )}
              </button>
               <button 
                 onClick={handlePlusClick} 
                 disabled={isFileUploadDisabled}
                 className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                 title={isFileUploadDisabled ? "File upload not available for Imagen model" : "Upload file or image"}
                >
                  <PlusIcon className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*, application/pdf, text/plain, text/csv, application/json, .js, .ts, .py, .html, .css, .md"
                onChange={handleFileSelect}
              />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onVoiceClick} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/50">
                <VoiceIcon className="w-5 h-5" />
            </button>
            <button
                onClick={handleSend}
                disabled={isLoading || (!inputValue.trim() && !stagedFile)}
                className="p-2.5 text-white bg-blue-600 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
            >
                <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-600 pt-2 font-sans">
        © 2025 RIZCSTZ | Indonesian Inc.
      </p>
    </div>
  );
};

export default ChatInput;