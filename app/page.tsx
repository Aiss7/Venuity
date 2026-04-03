'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapHeader } from '@/components/layout/MapHeader';
import { MapContainer } from '@/components/map/MapContainer';
import { VenueDetailPanel } from '@/components/map/VenueDetailPanel';
import { getVenues } from '@/actions/venues';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// Map skeleton — shown while MapContainer mounts (MapLibre needs the DOM)
// ---------------------------------------------------------------------------

function MapSkeleton() {
  return (
    <div className="w-full h-full animate-pulse bg-muted rounded-md border border-border" />
  );
}

// ---------------------------------------------------------------------------
// Home page — Client Component (Controller)
//
// State ownership:
//   venues       — the full list fetched on mount (source of truth)
//   visibleVenues — the filtered slice shown on the map; defaults to all venues
//
// Data flow:
//   MapSearch → onSearch → setVisibleVenues → MapContainer → VenueMap
// ---------------------------------------------------------------------------

export default function Home() {
  const searchParams = useSearchParams();
  const venueId = searchParams.get('venueId');

  const [venues, setVenues] = useState<Venue[]>([]);
  const [visibleVenues, setVisibleVenues] = useState<Venue[]>([]);

  // Fetch all venues once on mount; show all pins by default.
  useEffect(() => {
    getVenues().then(({ data }) => {
      if (data) {
        setVenues(data);
        setVisibleVenues(data);
      }
    });
  }, []);

  // Stable callback — won't cause VenueMap's marker effect to thrash.
  const handleSearch = useCallback((results: Venue[]) => {
    setVisibleVenues(results);
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden p-4">
      {/* Header with search bar — onSearch updates visibleVenues */}
      <MapHeader onSearch={handleSearch} />

      {/* Map region — relative so VenueDetailPanel (absolute) anchors here */}
      <div className="relative flex-1 min-h-0">
        <Suspense fallback={<MapSkeleton />}>
          <MapContainer initialVenues={visibleVenues} />
        </Suspense>

        {venueId && <VenueDetailPanel venueId={venueId} />}
      </div>
    </div>
  );
}
