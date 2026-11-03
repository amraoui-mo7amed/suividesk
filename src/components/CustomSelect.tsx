import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  labelRight?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '— Sélectionner —',
  label,
  labelRight,
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  icon,
  className = '',
  buttonClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const estimatedMaxHeight = searchable ? 310 : 260;
    const spaceBelow = viewportHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow;
    const menuWidth = Math.max(rect.width, 210);
    const clampedLeft = Math.min(rect.left, Math.max(8, viewportWidth - menuWidth - 8));

    if (openUpward) {
      setMenuStyle({
        position: 'fixed',
        left: `${clampedLeft}px`,
        bottom: `${viewportHeight - rect.top + 6}px`,
        minWidth: `${rect.width}px`,
        maxWidth: `min(92vw, 380px)`,
        maxHeight: `${Math.min(estimatedMaxHeight, Math.max(140, spaceAbove))}px`,
        zIndex: 99999
      });
    } else {
      setMenuStyle({
        position: 'fixed',
        left: `${clampedLeft}px`,
        top: `${rect.bottom + 6}px`,
        minWidth: `${rect.width}px`,
        maxWidth: `min(92vw, 380px)`,
        maxHeight: `${Math.min(estimatedMaxHeight, Math.max(140, spaceBelow))}px`,
        zIndex: 99999
      });
    }
  }, [searchable]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      updatePosition();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  const filteredOptions =
    searchable && search.trim()
      ? options.filter(
          (o) =>
            o.label.toLowerCase().includes(search.trim().toLowerCase()) ||
            (o.subtitle && o.subtitle.toLowerCase().includes(search.trim().toLowerCase()))
        )
      : options;

  return (
    <div className={`relative overflow-visible ${className}`}>
      {(label || labelRight) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F]">
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearch('');
        }}
        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 cnas-input cursor-pointer ${
          isOpen ? '!bg-white !border-[#005A9E] ring-3 ring-[#0068B5]/20' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-[#005A9E] flex-shrink-0">{icon}</span>}
          <span
            className={`truncate ${
              selectedOption && selectedOption.value !== ''
                ? 'text-[#003A6B] font-bold'
                : 'text-slate-600 font-semibold'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#005A9E] flex-shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            data-portal-select-menu="true"
            style={menuStyle}
            className="bg-white border-2 border-[#7FAAD6] rounded-2xl shadow-2xl shadow-[#003A6B]/25 flex flex-col overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-[#C6DDF2] bg-[#EEF6FC] flex-shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#005A9E] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#8EB4D9] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#005A9E]"
                  />
                </div>
              </div>
            )}

            <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-600 font-medium">
                  Aucun résultat trouvé
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={`${opt.value}-${opt.label}`}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#005A9E] text-white font-bold shadow-sm'
                          : 'text-slate-800 hover:bg-[#E3F0FC] hover:text-[#003A6B] font-semibold'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{opt.label}</div>
                        {opt.subtitle && (
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-sky-100' : 'text-slate-600'
                            }`}
                          >
                            {opt.subtitle}
                          </div>
                        )}
                      </div>

                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-white" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
