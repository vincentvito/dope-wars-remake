'use client';

import { useUIStore } from '@/stores/ui-store';
import type { GameNotification } from '@/stores/ui-store';

const styleMap = {
  profit: {
    classes: 'border-crt-green text-crt-green text-glow-green bg-crt-green/10',
    shadow: '0 0 16px var(--glow-primary), 0 0 32px var(--glow-primary-soft)',
  },
  loss: {
    classes: 'border-crt-red text-crt-red text-glow-red bg-crt-red/10',
    shadow: '0 0 16px var(--glow-danger), 0 0 32px var(--glow-danger-soft)',
  },
  neutral: {
    classes: 'border-crt-cyan text-crt-cyan bg-crt-cyan/10',
    shadow: '0 0 16px var(--glow-info), 0 0 32px var(--glow-info-soft)',
  },
};

function Toast({ notification }: { notification: GameNotification }) {
  const removeNotification = useUIStore((s) => s.removeNotification);
  const style = styleMap[notification.type];
  const exitDelay = notification.duration - 800;

  return (
    <div
      className={`
        font-pixel text-[10px] leading-tight px-3 py-2 whitespace-nowrap
        border-2 rounded bg-cyan-900/80 backdrop-blur-sm
        ${style.classes}
      `}
      style={{
        boxShadow: style.shadow,
        animation: `toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1), toast-out 0.3s ease-in ${exitDelay}ms forwards, toast-glow-pulse 1.5s ease-in-out infinite`,
      }}
      onClick={() => removeNotification(notification.id)}
    >
      {notification.message}
    </div>
  );
}

export function GameToast() {
  const notifications = useUIStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} />
      ))}
    </div>
  );
}
