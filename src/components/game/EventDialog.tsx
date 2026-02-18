'use client';

import { useGameStore } from '@/stores/game-store';

const EVENT_GIFS: Record<string, string> = {
  mugging: '/sprites/events/event-mugging.gif',
  find_drugs: '/sprites/events/event-find-drugs.gif',
  find_gun: '/sprites/events/event-find-gun.gif',
  find_coat: '/sprites/events/event-find-coat.gif',
  loan_shark_goons: '/sprites/events/event-loan-shark.gif',
  find_backpack: '/sprites/events/event-find-coat.gif',
  find_duffel: '/sprites/events/event-find-coat.gif',
  find_trenchcoat: '/sprites/events/event-find-coat.gif',
  find_suitcase: '/sprites/events/event-find-coat.gif',
  find_weapon: '/sprites/events/event-find-gun.gif',
  reputation_penalty: '/sprites/events/event-mugging.gif',
};

const POSITIVE_EVENTS = new Set([
  'find_drugs', 'find_gun', 'find_coat', 'find_backpack', 'find_duffel',
  'find_trenchcoat', 'find_suitcase', 'find_weapon',
  'cartel_offer', 'celebrity_buyer',
]);

const NEGATIVE_EVENTS = new Set([
  'mugging', 'loan_shark_goons', 'drug_bust',
  'rival_dealers', 'informant_betrayal', 'territory_dispute',
  'reputation_penalty',
]);

export function EventDialog() {
  const gameState = useGameStore((s) => s.gameState);
  const proGameState = useGameStore((s) => s.proGameState);
  const isPro = useGameStore((s) => s.isPro);
  const acceptEvent = useGameStore((s) => s.acceptEvent);
  const declineEvent = useGameStore((s) => s.declineEvent);

  const state = isPro ? proGameState : gameState;
  const isOpen = state?.phase === 'event' && state.activeEvent != null;
  const event = state?.activeEvent;

  if (!isOpen || !event) return null;

  const isPositive = POSITIVE_EVENTS.has(event.type);
  const isNegative = NEGATIVE_EVENTS.has(event.type);
  const isChoiceEvent = isPositive;

  const gifSrc = EVENT_GIFS[event.type];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Full-screen GIF background */}
      {gifSrc && (
        <img
          src={gifSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-35 pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
      )}

      {/* Vignette overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* Content overlay */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-4">
        {/* Title */}
        <h2 className={`font-pixel text-lg ${
          isPositive ? 'text-crt-green text-glow-green' :
          isNegative ? 'text-crt-red text-glow-red' :
          'text-crt-amber text-glow-amber'
        }`}>
          {isPositive ? 'Lucky!' : isNegative ? 'Bad News!' : 'Event'}
        </h2>

        {/* Weapon tier badge (Pro) */}
        {event.type === 'find_weapon' && event.weapon && (
          <div className={`font-pixel text-[10px] ${
            event.weapon.tier === 'Heavy' ? 'text-crt-red' :
            event.weapon.tier === 'Rifle' ? 'text-crt-amber' :
            event.weapon.tier === 'SMG' ? 'text-crt-cyan' :
            'text-muted-foreground'
          }`}>
            [{event.weapon.tier} Tier]
          </div>
        )}

        {/* Event message */}
        <p className="text-sm text-foreground text-center leading-relaxed">
          {event.message}
        </p>

        {/* Actions */}
        {isChoiceEvent ? (
          <div className="flex gap-2 w-full">
            <button
              className="retro-btn flex-1 py-2 text-xs"
              onClick={acceptEvent}
            >
              Take it!
            </button>
            <button
              className="retro-btn retro-btn-red flex-1 py-2 text-xs"
              onClick={declineEvent}
            >
              Leave it
            </button>
          </div>
        ) : (
          <button
            className="retro-btn w-full py-2 text-xs"
            onClick={acceptEvent}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
