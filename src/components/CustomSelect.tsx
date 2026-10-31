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
  compact?: boolean;
  menuAlign?: 'left' | 'right';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  label,
  className = '',
  searchable = false,
  compact = false,
  menuAlign = 'left'
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
    <div className={`relative overflow-visible ${className} ${isOpen ? 'z-50' : 'z-10'}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button with Full Text Wrapping & Non-clipping */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left rounded-xl transition-all flex items-center justify-between gap-1.5 border ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
        } bg-[#0d1527] border-slate-700/80 text-white hover:border-cyan-500/50 ${
          isOpen ? 'ring-2 ring-[#0055A5]/50 border-[#0055A5]' : ''
        }`}
      >
        <div className="flex-1 min-w-0 pr-1">
          {selectedOption ? (
            <div className="whitespace-normal break-words leading-tight">
              <span className="font-semibold text-white">
                {selectedOption.label}
              </span>
              {selectedOption.subtitle && (
                <span className="text-[10px] text-slate-300 ml-1.5 font-normal">
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

      {/* Solid Opaque Floating Dropdown Menu (No Transparency, High Z-Index, Full Overflow) */}
      {isOpen && (
        <div 
          className={`absolute ${menuAlign === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 rounded-2xl shadow-2xl border border-slate-700 bg-[#0b1329] text-slate-100 transition-all`}
          style={{ 
            minWidth: '100%',
            width: 'max-content',
            maxWidth: 'min(90vw, 460px)',
            maxHeight: '320px',
            backgroundColor: '#0b1329',
            opacity: 1,
            zIndex: 9999
          }}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-800 bg-[#080d1d] rounded-t-2xl">
              <input
                type="text"
                autoFocus
                placeholder="Filtrer options..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-400"
              />
            </div>
          )}

          <div 
            className="overflow-y-auto max-h-64 p-1.5 space-y-1 rounded-b-2xl"
            style={{ backgroundColor: '#0b1329' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center italic">
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
                    className={`px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#0055A5] text-white font-bold shadow-sm'
                        : 'hover:bg-slate-800/90 text-slate-200'
                    }`}
                  >
                    <div className="flex-1 whitespace-normal break-words leading-relaxed">
                      <div className="font-semibold">{opt.label}</div>
                      {opt.subtitle && (
                        <div className={`text-[10px] mt-0.5 leading-snug ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
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
