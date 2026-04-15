'use client';

// ---------------------------------------------------------------------------
// RoutePanel — Sliding Window queue for turn-by-turn directions.
//
// Shows the next 4 steps at a time. The user marks the top step as reached
// which shifts the window forward. No scrollbar — the card grows/shrinks
// naturally with the visible slice.
//
// Anchored: top-24 left-4 (below MapLibre zoom controls).
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import {
  X,
  Navigation2,
  AlertCircle,
  Loader2,
  Clock,
  Route,
  CheckCircle2,
  FlagTriangleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { OsrmStep } from '@/types/routing';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function stepRotation(step: OsrmStep): number {
  const mod = step.maneuver.modifier ?? '';
  if (mod.includes('sharp left') || mod === 'uturn') return -180;
  if (mod.includes('left')) return -90;
  if (mod.includes('right')) return 90;
  return 0;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WINDOW_SIZE = 4; // max visible steps at once

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RoutePanelProps {
  steps: OsrmStep[];
  totalDistance: number;
  totalDuration: number;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoutePanel({
  steps,
  totalDistance,
  totalDuration,
  isLoading,
  error,
  onClose,
}: RoutePanelProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Reset window whenever a fresh route arrives.
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [steps]);

  // Filter steps that have actual instruction text.
  const meaningfulSteps = steps.filter(
    (s) => s.maneuver.instruction || s.name || s.maneuver.type,
  );

  const isFinished = currentStepIndex >= meaningfulSteps.length;
  const visibleSteps = meaningfulSteps.slice(
    currentStepIndex,
    currentStepIndex + WINDOW_SIZE,
  );

  function handleMarkReached() {
    setCurrentStepIndex((i) => Math.min(i + 1, meaningfulSteps.length));
  }

  return (
    <div
      className={[
        // ── Position: top-left, below zoom controls ──
        'absolute top-24 left-4 z-40',
        'w-72',
        'flex flex-col',
        'rounded-xl border border-zinc-800 bg-sidebar/95 backdrop-blur-md',
        'shadow-2xl',
        'animate-in slide-in-from-top-4 duration-300',
      ].join(' ')}
      role="complementary"
      aria-label="Turn-by-turn directions"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Route size={14} className="text-primary shrink-0" />
          <span className="font-semibold text-xs text-foreground tracking-wide uppercase">
            Directions
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close route panel"
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <Separator />

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-8 px-4">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground text-center">
            Getting your location&hellip;
          </p>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="flex flex-col items-center gap-2.5 py-6 px-4 text-center">
          <AlertCircle size={24} className="text-destructive shrink-0" />
          <p className="text-xs text-destructive leading-snug">{error}</p>
          <Button size="sm" variant="outline" onClick={onClose} className="mt-1 h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* ── Active navigation ───────────────────────────────────────────── */}
      {!isLoading && !error && meaningfulSteps.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-3 px-3 py-2 bg-primary/10 shrink-0">
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
              <Route size={11} />
              {formatDistance(totalDistance)}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
              <Clock size={11} />
              {formatDuration(totalDuration)}
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {Math.min(currentStepIndex + 1, meaningfulSteps.length)}/{meaningfulSteps.length}
            </span>
          </div>

          <Separator />

          {/* ── Finished state ─────────────────────────────────────────── */}
          {isFinished ? (
            <div className="flex flex-col items-center gap-3 py-6 px-4 text-center">
              <FlagTriangleRight size={28} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">You&apos;ve arrived!</p>
              <Button
                size="sm"
                variant="default"
                onClick={onClose}
                className="h-8 text-xs w-full"
              >
                Finish Navigation
              </Button>
            </div>
          ) : (
            /* ── Sliding window step list ────────────────────────────── */
            <ul className="py-1.5">
              {visibleSteps.map((step, idx) => {
                const instruction =
                  step.maneuver.instruction || step.name || step.maneuver.type;
                const isNext = idx === 0; // first visible = immediate next action

                return (
                  <li
                    key={`${currentStepIndex}-${idx}`}
                    className={[
                      'flex items-start gap-2.5 px-3 py-2 transition-colors',
                      isNext
                        ? 'bg-primary/8 border-l-2 border-primary'
                        : 'border-l-2 border-transparent opacity-60',
                    ].join(' ')}
                  >
                    {/* Direction icon */}
                    <span
                      className={[
                        'mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full',
                        isNext ? 'bg-primary/20' : 'bg-muted',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      <Navigation2
                        size={10}
                        className={isNext ? 'text-primary' : 'text-muted-foreground'}
                        style={{ transform: `rotate(${stepRotation(step)}deg)` }}
                      />
                    </span>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={[
                          'text-xs leading-snug',
                          isNext ? 'text-foreground font-medium' : 'text-muted-foreground',
                        ].join(' ')}
                      >
                        {instruction}
                      </p>
                      {step.distance > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistance(step.distance)}
                        </p>
                      )}
                    </div>

                    {/* Mark-reached button — only on the leading step */}
                    {isNext && (
                      <button
                        onClick={handleMarkReached}
                        aria-label="Mark step as reached"
                        title="Mark as reached"
                        className={[
                          'shrink-0 mt-0.5 rounded-full p-0.5',
                          'text-primary hover:text-primary/80',
                          'hover:bg-primary/10 transition-colors',
                        ].join(' ')}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
