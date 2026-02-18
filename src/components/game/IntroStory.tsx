'use client';

import { useState, useCallback, useEffect } from 'react';

interface IntroStoryProps {
  onComplete: () => void;
  onBack: () => void;
}

interface StorySlide {
  primary: string;
  secondary: string;
  secondaryStyle: 'dim' | 'accent';
  showStartButton?: boolean;
}

const SLIDE_BACKGROUNDS = [
  '/sprites/intro/intro-1-office.png',
  '/sprites/intro/intro-2-fired.png',
  '/sprites/intro/intro-3-daughter.png',
  '/sprites/intro/intro-4-poverty.png',
  '/sprites/intro/intro-5-call.png',
  '/sprites/intro/intro-6-loanshark.png',
];

const SLIDES: StorySlide[] = [
  {
    primary: 'You were somebody once.',
    secondary: 'Corner office. Good salary. Respect.',
    secondaryStyle: 'dim',
  },
  {
    primary: 'Then the AI came.',
    secondary: 'One meeting. One email. Done.',
    secondaryStyle: 'dim',
  },
  {
    primary: 'Sofia is only 7.',
    secondary: "She doesn't understand why her daddy cries at night.",
    secondaryStyle: 'dim',
  },
  {
    primary: 'Fridge is empty. Rent is due.',
    secondary: "You're out of money and options.",
    secondaryStyle: 'dim',
  },
  {
    primary: 'Then Tommy called.',
    secondary: "'I know a way to make real money.'",
    secondaryStyle: 'accent',
  },
  {
    primary: 'You borrowed $5,000 from the wrong people.',
    secondary: '30 days. 10% daily interest. Pay it back — or disappear.',
    secondaryStyle: 'accent',
    showStartButton: true,
  },
];

export function IntroStory({ onComplete, onBack }: IntroStoryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visible, setVisible] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const goToSlide = useCallback(
    (next: number) => {
      if (transitioning || next < 0 || next >= SLIDES.length) return;
      setTransitioning(true);
      setVisible(false);

      setTimeout(() => {
        setCurrentSlide(next);
        setVisible(true);
        setTimeout(() => setTransitioning(false), 400);
      }, 250);
    },
    [transitioning]
  );

  const handleAdvance = useCallback(() => {
    if (isLastSlide) return;
    goToSlide(currentSlide + 1);
  }, [currentSlide, isLastSlide, goToSlide]);

  const handleBack = useCallback(() => {
    if (currentSlide === 0) {
      onBack();
      return;
    }
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide, onBack]);

  // Preload all background images to prevent loading flash on tap
  useEffect(() => {
    SLIDE_BACKGROUNDS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAdvance();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance, handleBack, onBack]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-start"
      onClick={(e) => {
        if (!isLastSlide && !(e.target as HTMLElement).closest('button')) {
          handleAdvance();
        }
      }}
      style={{ cursor: !isLastSlide ? 'pointer' : 'default' }}
    >
      {/* Background image */}
      <img
        src={SLIDE_BACKGROUNDS[currentSlide]}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none transition-opacity duration-[250ms] ease-out ${
          visible ? 'opacity-35' : 'opacity-0'
        }`}
        style={{ imageRendering: 'pixelated' }}
        draggable={false}
      />

      {/* Vignette overlay — dark at top for text readability, transparent at bottom for image */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Back button */}
      {currentSlide > 0 && (
        <button
          className="absolute top-4 left-4 z-10 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors font-pixel"
          onClick={(e) => {
            e.stopPropagation();
            handleBack();
          }}
        >
          BACK
        </button>
      )}

      {/* Skip button */}
      <button
        className="absolute top-4 right-4 z-10 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors font-pixel"
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
      >
        SKIP
      </button>

      {/* Text content — upper half */}
      <div
        className={`relative z-10 w-full max-w-md px-8 text-center pt-[20vh] transition-all duration-[250ms] ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {/* Primary line */}
        <p className="font-pixel text-sm md:text-base text-crt-cyan text-glow-blue leading-relaxed">
          {slide.primary}
        </p>

        {/* Secondary line */}
        <p
          className={`text-xs md:text-sm leading-relaxed mt-4 ${
            slide.secondaryStyle === 'accent'
              ? 'text-crt-amber text-glow-amber'
              : 'text-muted-foreground'
          }`}
        >
          {slide.secondary}
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 justify-center mt-10">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'bg-crt-cyan shadow-[0_0_6px_var(--crt-cyan)]'
                  : i < currentSlide
                    ? 'bg-crt-cyan/40'
                    : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>

        {/* Tap hint or START GAME */}
        {isLastSlide ? (
          <button
            className="retro-btn w-full max-w-xs py-4 text-xs font-bold font-pixel mt-8 mx-auto"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
          >
            START GAME
          </button>
        ) : (
          <p className="text-[9px] text-muted-foreground/30 mt-6 animate-pulse font-pixel">
            tap to continue
          </p>
        )}
      </div>
    </div>
  );
}
