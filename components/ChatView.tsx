import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import FinalBotMessage from './FinalBotMessage';
import { CusstzzLogo, FileIcon } from './Icons';

declare global {
  interface Window {
    marked: {
      parse: (markdownString: string) => string;
    };
  }
}

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onStageImageForEditing: (imageUrl: string) => void;
}

const WelcomeScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center min-h-[70vh] relative px-4 font-sans">
    {/* Ambient Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8a2be2]/10 blur-[120px] rounded-full pointer-events-none"></div>
    
    <div className="relative mb-8 transform transition-all hover:scale-105 duration-500">
      {/* Logo Container */}
      <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-b from-gray-800/30 to-transparent rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00c6ff]/20 to-[#8a2be2]/20 rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CusstzzLogo className="w-14 h-14" />
      </div>
    </div>
    
    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00c6ff] via-[#8a2be2] to-[#00eaff] animate-gradient">
        CustzAI
      </span>
    </h1>
    
    <p className="text-gray-400 text-lg md:text-xl max-w-xl leading-relaxed animate-fade-in-up">
      Apa yang bisa saya bantu hari ini?
    </p>
  </div>
);

const UserMessage: React.FC<{ message: Message }> = ({ message }) => {
    // Check if uploaded URL is an image based on simple data URI check or extension logic if needed.
    // For data URIs, we can check mime type.
    const isImage = message.uploadedImageUrl?.startsWith('data:image');
    
    return (
      <div className="flex items-start my-6 justify-end">
        <div className="max-w-xl text-right">
          <p className="font-medium text-gray-200 text-xs mb-1 opacity-70">You</p>
          
          {message.uploadedImageUrl && (
              isImage ? (
                  <img src={message.uploadedImageUrl} alt="Uploaded content" className="mt-2 rounded-xl max-w-xs ml-auto border border-gray-700/50 shadow-lg" />
              ) : (
                   <div className="mt-2 ml-auto inline-flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-gray-700/50 shadow-lg">
                        <div className="p-2 bg-gray-700 rounded-lg">
                            <FileIcon className="w-6 h-6 text-gray-300" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-gray-200">Attached File</p>
                            <p className="text-xs text-gray-500">Document/Data</p>
                        </div>
                   </div>
              )
          )}
          
          <p className="mt-1 text-gray-200 whitespace-pre-wrap text-left bg-[#2A2A2A] px-5 py-3 rounded-2xl rounded-tr-none border border-gray-700/30 inline-block shadow-md">
              {message.text}
          </p>
        </div>
      </div>
    );
};

const ChatView: React.FC<ChatViewProps> = ({ messages, isLoading, onSendMessage, onStageImageForEditing }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {messages.map((message) => (
        message.sender === 'user' ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <FinalBotMessage 
            key={message.id} 
            message={message} 
            onStageImageForEditing={onStageImageForEditing}
            onSendMessage={onSendMessage}
          />
        )
      ))}
      {/* Visual spacer to lift the last message above the input bar */}
      <div className="h-10" /> 
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatView;