import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface Option {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  label,
  className = '',
  searchable = false
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredOptions = searchable && search.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  return (
    <div className={`relative overflow-visible ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button with Full Text Wrapping */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 border ${
          theme === 'dark' 
            ? 'glass-input-dark bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/50' 
            : 'glass-input-light bg-white border-slate-300 hover:border-blue-400'
        } ${isOpen ? 'ring-2 ring-[#0055A5]/40 border-[#0055A5]' : ''}`}
      >
        <div className="flex-1 min-w-0 pr-1">
          {selectedOption ? (
            <div className="whitespace-normal break-words leading-snug">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {selectedOption.label}
              </span>
              {selectedOption.subtitle && (
                <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                  {selectedOption.subtitle}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 italic">{placeholder}</span>
          )}
        </div>

        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Glass Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl shadow-2xl border overflow-hidden transition-all ${
            theme === 'dark' 
              ? 'glass-panel-dark bg-slate-950/98 border-slate-700/90 text-slate-100' 
              : 'glass-panel-light bg-white/98 border-slate-200 text-slate-900 shadow-blue-900/10'
          }`}
          style={{ minWidth: '100%', maxHeight: '280px' }}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-800">
              <input
                type="text"
                autoFocus
                placeholder="Filtrer options..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>
          )}

          <div className="overflow-y-auto max-h-60 p-1.5 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                Aucune option trouvée
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#0055A5] text-white font-bold'
                        : theme === 'dark'
                          ? 'hover:bg-slate-800/80 text-slate-200'
                          : 'hover:bg-blue-50 text-slate-700'
                    }`}
                  >
                    <div className="flex-1 whitespace-normal break-words leading-relaxed">
                      <div className="font-semibold">{opt.label}</div>
                      {opt.subtitle && (
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {opt.subtitle}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-white" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
