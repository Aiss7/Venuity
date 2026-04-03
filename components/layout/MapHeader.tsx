'use client';

import { Badge } from '@/components/ui/badge';
import { MapSearch } from '@/components/search/MapSearch';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// MapHeader — top bar for the interactive map page.
// Receives onSearch from page.tsx and forwards it to MapSearch.
// ---------------------------------------------------------------------------

interface MapHeaderProps {
  onSearch: (venues: Venue[]) => void;
}

export function MapHeader({ onSearch }: MapHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-4 mb-4 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-foreground tracking-tight">
          Interactive Event Map
        </h1>
        <Badge variant="secondary">Butuan City</Badge>
      </div>

      <MapSearch onSearch={onSearch} />
    </div>
  );
}
