import React from 'react';
import { ChatSession } from '../types';
import { NewChatIcon, CloseIcon, GithubIcon } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatSession[];
  onLoadChat: (sessionId: string) => void;
  onNewChat: () => void;
  activeChatId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, history, onLoadChat, onNewChat, activeChatId }) => {
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  const handleNewChatClick = () => {
    onNewChat();
    onClose();
  };
  
  const handleLoadChatClick = (id: string) => {
    if (id === activeChatId) {
        onClose();
        return;
    }
    onLoadChat(id);
    onClose();
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      ></div>
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-[#121212] border-r border-gray-800/50 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
        hidden={!isOpen}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-800/50">
          <h2 id="sidebar-title" className="text-xl font-semibold text-white">History</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full" aria-label="Close history sidebar">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-2">
            <button 
              onClick={handleNewChatClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 rounded-md hover:bg-gray-800 transition-colors"
            >
              <NewChatIcon className="w-5 h-5" />
              <span>New Chat</span>
            </button>
        </div>

        <nav className="flex-grow overflow-y-auto p-2 h-[calc(100%-180px)]">
          {sortedHistory.length > 0 ? (
            <ul>
              {sortedHistory.map(session => (
                <li key={session.id}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleLoadChatClick(session.id); }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-md truncate transition-colors ${
                        activeChatId === session.id 
                        ? 'bg-gray-700 text-white' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {session.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-500 px-4 py-8">
              <p>No chat history yet.</p>
              <p className="text-xs mt-2">Start a conversation to see it here.</p>
            </div>
          )}
        </nav>
        
        {/* Identity Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800/50 bg-[#0A0A0A]">
            <a 
                href="https://github.com/rizcstz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
            >
                <div className="p-2 bg-gray-800 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                    <GithubIcon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-200">RIZCSTZ Inc.</p>
                    <p className="text-[10px] text-gray-500">Developer Profile</p>
                </div>
            </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;