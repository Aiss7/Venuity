'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapHeader } from '@/components/layout/MapHeader';
import { MapContainer } from '@/components/map/MapContainer';
import { VenueDetailPanel } from '@/components/map/VenueDetailPanel';
import { getVenueById } from '@/actions/venues';
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
// Data flow:
//   1. venueId in URL → fetch that venue → setVisibleVenues([data])
//      VenueMap receives the single venue and, once isMapReady fires,
//      drops the pin safely with no race condition.
//   2. MapSearch.onSearch → setVisibleVenues(results)
//      Same path — marker effect re-runs after isMapReady.
// ---------------------------------------------------------------------------

export default function Home() {
  const searchParams = useSearchParams();
  const venueId = searchParams.get('venueId');

  const [visibleVenues, setVisibleVenues] = useState<Venue[]>([]);

  // When a deep-link venueId appears (from Bookmarks or History), fetch
  // that venue and seed the map so its pin is ready for VenueMap to place.
  // Runs whenever venueId changes — handles direct navigation and browser back/forward.
  useEffect(() => {
    if (!venueId) {
      // No venueId — don't clear user's existing search results.
      return;
    }

    getVenueById(venueId).then(({ data }) => {
      if (data) setVisibleVenues([data]);
    });
  }, [venueId]);

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
          <MapContainer initialVenues={visibleVenues} activeVenueId={venueId ?? undefined} />
        </Suspense>

        {venueId && <VenueDetailPanel venueId={venueId} />}
      </div>
    </div>
  );
}
