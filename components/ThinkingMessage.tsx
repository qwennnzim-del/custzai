import React, { useState } from 'react';
import { Message } from '../types';
import { CusstzzLogo } from './Icons';

interface ThinkingMessageProps {
  message: Message;
}

const ThinkingMessage: React.FC<ThinkingMessageProps> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // When streaming is done, parse the full text as Markdown.
  const finalContentHtml = !message.isStreaming && typeof window.marked?.parse === 'function'
      ? window.marked.parse(message.text)
      // Fallback for when marked is not available.
      : `<p>${message.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;

  return (
    <div className="flex gap-4 items-start my-6">
      <CusstzzLogo className="w-8 h-8 rounded-full flex-shrink-0 mt-2" />
      <div 
        className="w-full max-w-xl border border-gray-700/50 bg-[#1A1A1A]/50 rounded-lg transition-all duration-300 ease-in-out"
      >
        <div 
          className="px-4 py-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center gap-3">
                <div className="w-6 h-6">
                    <CusstzzLogo className={`w-full h-full ${message.isStreaming ? 'animate-pulse' : ''}`} />
                </div>
                <p className="text-gray-300 font-medium">
                  {message.isStreaming ? 'Thinking...' : 'Proses Berpikir'}
                </p>
            </div>
        </div>
        <div 
          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isExpanded ? 'max-h-[100rem]' : 'max-h-0'}`}
        >
          <div className="p-4 border-t border-gray-700/50">
            {message.isStreaming ? (
              <pre className="text-gray-400 text-sm whitespace-pre-wrap break-words font-mono">
                  {message.text}
              </pre>
            ) : (
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: finalContentHtml }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingMessage;