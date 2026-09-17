'use client';
import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Full-screen encounters retain the game's art while trapping keyboard focus. */
export function ScreenDialog({ title, children, className, onClose }: { onClose?: () => void; title: string; children: ReactNode; className?: string }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose?.(); }}>
    <DialogContent showCloseButton={false} onEscapeKeyDown={e => { if (!onClose) e.preventDefault(); }} onPointerDownOutside={e => e.preventDefault()}
      className={cn('w-full max-w-[480px] h-[100dvh] max-h-none rounded-none border-0 p-0 gap-0 bg-black flex flex-col items-center overflow-y-auto overflow-x-hidden', className)}>
      <DialogTitle className="sr-only">{title}</DialogTitle>
      {children}
    </DialogContent>
  </Dialog>;
}
