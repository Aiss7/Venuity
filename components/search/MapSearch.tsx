'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getVenues } from '@/actions/venues';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// MapSearch — fast, client-side venue filtering.
// All venues are fetched once on mount; filtering is synchronous so there is
// zero latency and partial strings (e.g. 'lmx') work correctly.
// ---------------------------------------------------------------------------

interface MapSearchProps {
  onSearch: (venues: Venue[]) => void;
}

export function MapSearch({ onSearch }: MapSearchProps) {
  const router = useRouter();

  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Venue[]>([]);
  const [open, setOpen] = useState(false);

  // Fetch the full venue list once on mount.
  useEffect(() => {
    getVenues().then(({ data }) => {
      if (data) setAllVenues(data);
    });
  }, []);

  // Synchronous filter whenever input or the venue list changes.
  useEffect(() => {
    if (input.trim() === '') {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const q = input.toLowerCase();
    const filtered = allVenues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.address?.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q),
    );

    setSuggestions(filtered.slice(0, 5));
    setOpen(filtered.length > 0);
  }, [input, allVenues]);

  function handleSelect(venue: Venue) {
    // Show only this one pin on the map, then open its detail panel.
    onSearch([venue]);
    router.push(`?venueId=${venue.id}`);
    setInput('');
    setSuggestions([]);
    setOpen(false);
  }

  function handleEnter() {
    if (suggestions.length === 0) return;
    // Drop all matching pins onto the map without opening the detail panel.
    onSearch(suggestions);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
            placeholder="Search event venues…"
            className="pl-9 h-9 text-sm bg-muted/50 border-border/60 focus-visible:bg-background"
            aria-label="Search venues"
            aria-autocomplete="list"
            aria-expanded={open}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-1 mt-1"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {suggestions.length > 0 && (
          <>
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Matching Venues
            </p>
            <ul role="listbox" aria-label="Venue suggestions">
              {suggestions.map((venue) => (
                <li key={venue.id}>
                  <button
                    onClick={() => handleSelect(venue)}
                    className="w-full text-left flex items-start gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    role="option"
                  >
                    <MapPin size={14} className="shrink-0 mt-0.5 text-primary" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{venue.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {venue.address ?? 'Butuan City'}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
