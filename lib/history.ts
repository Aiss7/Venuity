import type { Venue } from '@/types';

const HISTORY_KEY = 'venuity_history';
const MAX_HISTORY = 20;

// ---------------------------------------------------------------------------
// saveToHistory
// Prepends the given venue to the browser's local history list.
// Duplicates (by id) are removed before inserting so the item always appears
// at the top of the list.
// Safe to call server-rendered code paths — returns early if window is absent.
// ---------------------------------------------------------------------------

export function saveToHistory(venue: Venue): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const existing: Venue[] = raw ? (JSON.parse(raw) as Venue[]) : [];

    // Remove any previous entry for this venue, then prepend.
    const deduped = existing.filter((v) => v.id !== venue.id);
    const updated = [venue, ...deduped].slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded).
    // Fail silently — history is a non-critical enhancement.
  }
}

// ---------------------------------------------------------------------------
// getHistory
// Reads the stored history list. Returns an empty array on any failure.
// ---------------------------------------------------------------------------

export function getHistory(): Venue[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Venue[]) : [];
  } catch {
    return [];
  }
}
