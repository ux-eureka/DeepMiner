import React, { useState, useRef, useEffect } from 'react';
import { useAIConfig } from '../../context/AIConfigContext';
import { cn } from '../../utils/cn';
import { Check, ChevronUp, Search, Settings, Cpu } from 'lucide-react';

export const ModelPresetSelector: React.FC = () => {
  const { presets, currentPresetId, selectPreset, openSettings } = useAIConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentPreset = presets.find(p => p.id === currentPresetId);

  const filteredPresets = presets.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      if (isOpen && searchInputRef.current) {
          searchInputRef.current.focus();
      }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        title="Switch AI Model"
      >
        <Cpu className="w-3.5 h-3.5" />
        <span className="max-w-[100px] truncate">{currentPreset?.name || 'Select Model'}</span>
        <ChevronUp className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-20 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search models..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                </div>
            </div>

            {/* List */}
            <div className="max-h-48 overflow-y-auto py-1">
                {filteredPresets.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-400 text-center">
                        No matching presets
                    </div>
                ) : (
                    filteredPresets.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => {
                                selectPreset(preset.id);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors",
                                currentPresetId === preset.id && "bg-blue-50 hover:bg-blue-50"
                            )}
                        >
                            <div className="flex flex-col min-w-0">
                                <span className={cn(
                                    "text-sm truncate",
                                    currentPresetId === preset.id ? "font-medium text-blue-700" : "text-slate-700"
                                )}>
                                    {preset.name}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase">
                                    {preset.provider}
                                </span>
                            </div>
                            {currentPresetId === preset.id && (
                                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                            )}
                        </button>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100 bg-gray-50">
                <button
                    onClick={() => {
                        setIsOpen(false);
                        openSettings();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-gray-200 rounded-md transition-colors"
                >
                    <Settings className="w-3.5 h-3.5" />
                    Manage Presets
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
