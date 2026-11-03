import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface PortalDropdownProps {
  trigger: (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode;
  children: (props: { close: () => void }) => React.ReactNode;
  align?: 'left' | 'right';
  widthClass?: string;
}

export const PortalDropdown: React.FC<PortalDropdownProps> = ({
  trigger,
  children,
  align = 'right',
  widthClass = 'w-64'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom - 12;
    const openUp = spaceBelow < 220 && rect.top > spaceBelow;

    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 99990
    };

    if (align === 'right') {
      base.right = `${Math.max(8, vw - rect.right)}px`;
    } else {
      base.left = `${Math.max(8, rect.left)}px`;
    }

    if (openUp) {
      base.bottom = `${vh - rect.top + 6}px`;
    } else {
      base.top = `${rect.bottom + 6}px`;
    }

    setStyle(base);
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePos();

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if ((t as Element)?.closest?.('[data-portal-select-menu="true"]')) {
        return;
      }
      if (
        wrapRef.current &&
        !wrapRef.current.contains(t) &&
        panelRef.current &&
        !panelRef.current.contains(t)
      ) {
        setIsOpen(false);
      }
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const onMove = (e: Event) => {
      if (panelRef.current && panelRef.current.contains(e.target as Node)) return;
      updatePos();
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [isOpen, updatePos]);

  return (
    <div ref={wrapRef} className="relative inline-block overflow-visible">
      {trigger({ isOpen, toggle: () => setIsOpen((v) => !v) })}

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={style}
            className={`${widthClass} rounded-2xl bg-white border-2 border-[#7FAAD6] shadow-2xl shadow-[#003A6B]/25 overflow-visible text-slate-900`}
          >
            {children({ close: () => setIsOpen(false) })}
          </div>,
          document.body
        )}
    </div>
  );
};
