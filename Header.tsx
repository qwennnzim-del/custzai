import React, { useState, useRef, useEffect } from 'react';
import { SidebarIcon, NewChatIcon, ChevronDownIcon, CusstzzLogo } from './Icons';
import { ModelType } from '../types';

interface HeaderProps {
  model: ModelType;
  onModelChange: (model: ModelType) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ model, onModelChange, onToggleSidebar, onNewChat }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getModelDisplayName = (m: ModelType) => {
    switch(m) {
        case 'gemini-3-pro-preview': return 'Pro 3.0';
        case 'imagen-4.0-generate-001': return 'Imagen';
        case 'gemini-2.5-flash-image': return 'Edit';
        default: return 'Flash';
    }
  };
  
  const modelDisplayName = getModelDisplayName(model);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModelSelect = (selectedModel: ModelType) => {
    onModelChange(selectedModel);
    setIsDropdownOpen(false);
  }

  const modelOptions: { id: ModelType; name: string; description: string }[] = [
    { id: 'gemini-2.5-flash', name: 'CusstzzAI Flash', description: 'Model tercepat untuk tugas sehari-hari.' },
    { id: 'gemini-3-pro-preview', name: 'CusstzzAI Pro 3.0', description: 'Reasoning canggih, Coding & Math.' },
    { id: 'imagen-4.0-generate-001', name: 'CusstzzAI Imagen', description: 'Buat gambar dari teks.' },
    { id: 'gemini-2.5-flash-image', name: 'CusstzzAI Edit', description: 'Unggah & edit gambar dengan AI.' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#0D0D0D] bg-opacity-80 backdrop-blur-sm z-20 border-b border-gray-800/50">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between h-16">
        <button onClick={onToggleSidebar} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Open chat history">
          <SidebarIcon className="w-6 h-6" />
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 border border-gray-700 rounded-full hover:bg-gray-800 transition-colors"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
             <CusstzzLogo className="w-5 h-5" />
            <span>
              <span className="font-semibold bg-gradient-to-r from-[#00c6ff] via-[#8a2be2] to-[#00eaff] bg-clip-text text-transparent animate-gradient">
                CusstzzAI
              </span>
              {' '}{modelDisplayName}
            </span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full mt-2 w-64 bg-[#1A1A1A] border border-gray-700/50 rounded-lg shadow-lg z-30 right-0 origin-top-right">
              <ul className="py-1" role="menu">
                {modelOptions.map((option) => (
                    <li
                      key={option.id}
                      onClick={() => handleModelSelect(option.id)}
                      className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm"
                      role="menuitem"
                    >
                      <p className={`font-medium ${model === option.id ? 'text-white' : 'text-gray-300'}`}>{option.name}</p>
                      <p className="text-xs text-gray-400">{option.description}</p>
                    </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <button onClick={onNewChat} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Start new chat">
          <NewChatIcon className="w-6 h-6" />
        </button>
      </nav>
    </header>
  );
};

export default Header;