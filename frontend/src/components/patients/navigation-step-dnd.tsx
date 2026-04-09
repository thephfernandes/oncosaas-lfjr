'use client';

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import type { JourneyStage } from '@/lib/utils/journey-stage';

export function buildNavDropId(typeKey: string, stage: JourneyStage): string {
  return `nav-drop::${typeKey}::${stage}`;
}

export function parseNavDropId(
  id: string
): { typeKey: string; stage: JourneyStage } | null {
  const parts = id.split('::');
  if (parts.length !== 3 || parts[0] !== 'nav-drop') return null;
  return { typeKey: parts[1], stage: parts[2] as JourneyStage };
}

export function StageDroppableColumn({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && 'rounded-lg ring-2 ring-primary/40 ring-offset-2')}
    >
      {children}
    </div>
  );
}

export function DraggableNavigationStep({
  stepId,
  children,
}: {
  stepId: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: stepId,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;

  const handle = (
    <button
      type="button"
      className={cn(
        'touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      aria-label="Arrastar etapa para outra fase"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex gap-2', isDragging && 'opacity-60')}
    >
      {children(handle)}
    </div>
  );
}
