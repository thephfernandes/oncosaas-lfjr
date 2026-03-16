'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  onResize?: (width: number) => void;
  side?: 'left' | 'right';
  forcedWidth?: number; // Largura forçada (para maximização)
}

export function ResizablePanel({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 800,
  storageKey,
  onResize,
  side = 'left',
  forcedWidth,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedWidth = parseInt(saved, 10);
        if (savedWidth >= minWidth && savedWidth <= maxWidth) {
          return savedWidth;
        }
      }
    }
    return defaultWidth;
  });

  // Se forcedWidth estiver definido, usar ele
  const effectiveWidth = forcedWidth ?? width;
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, width.toString());
    }
    onResize?.(width);
  }, [width, storageKey, onResize]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startXRef.current;

      const newWidth = Math.max(
        minWidth,
        Math.min(
          maxWidth,
          startWidthRef.current + (side === 'left' ? deltaX : -deltaX)
        )
      );

      setWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth, side]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative flex flex-shrink-0',
        forcedWidth && 'transition-all duration-300 ease-in-out'
      )}
      style={{
        width: `${effectiveWidth}px`,
        minWidth: forcedWidth ? `${effectiveWidth}px` : `${minWidth}px`,
        maxWidth: forcedWidth ? `${effectiveWidth}px` : `${maxWidth}px`,
        flexShrink: 0,
      }}
    >
      {!forcedWidth && (
        <div
          className={`absolute top-0 bottom-0 cursor-col-resize hover:bg-indigo-500 transition-colors z-10 ${
            side === 'left' ? 'right-0' : 'left-0'
          } ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
          onMouseDown={handleMouseDown}
          style={{
            width: '4px',
          }}
        >
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${
              side === 'left'
                ? 'right-0 translate-x-1/2'
                : 'left-0 -translate-x-1/2'
            }`}
          >
            <GripVertical className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden w-full">{children}</div>
    </div>
  );
}
