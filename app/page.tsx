'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapHeader } from '@/components/layout/MapHeader';
import { MapContainer } from '@/components/map/MapContainer';
import { VenueDetailPanel } from '@/components/map/VenueDetailPanel';
import { FloatingChat } from '@/components/chat/FloatingChat';
import { getVenueById } from '@/actions/venues';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueId = searchParams.get('venueId');

  const [visibleVenues, setVisibleVenues] = useState<Venue[]>([]);
  const [fitBoundsVenues, setFitBoundsVenues] = useState<Venue[]>();

  // When a deep-link venueId appears (from Bookmarks or History), fetch
  // that venue and seed the map so its pin is ready for VenueMap to place.
  // Runs whenever venueId changes — handles direct navigation and browser back/forward.
  useEffect(() => {
    if (!venueId) {
      // No venueId — don't clear user's existing search results.
      return;
    }

    getVenueById(venueId).then(({ data }) => {
      if (data) {
        setVisibleVenues([data]);
        setFitBoundsVenues(undefined);
      }
    });
  }, [venueId]);

  // Stable callback — won't cause VenueMap's marker effect to thrash.
  const handleSearch = useCallback((results: Venue[]) => {
    setVisibleVenues(results);
    setFitBoundsVenues(undefined);
  }, []);

  // Called by FloatingChat when the AI fires the showVenuesOnMap tool.
  // The AI only sends partial data (id, name, lat, lng) to save tokens.
  // We hydrate with full Venue rows via a single Supabase .in() query so
  // the map popups render correctly (images, category, price, etc.).
  //
  // Single venue  → flyTo + auto-open popup (Effect 3 in VenueMap via ?venueId=)
  // Multiple venues → fitBounds to show all of them (existing behaviour)
  const handleShowVenues = useCallback(async (venues: any[]) => {
    const venueIds: string[] = venues.map((v) => v.id);

    // Hydrate: fetch full rows so map popups and tooltips have all fields
    // including address (select('*') covers the address column).
    const supabase = createBrowserSupabaseClient();
    const { data: fullVenues } = await supabase
      .from('venues')
      .select('*')
      .in('id', venueIds);

    if (fullVenues && fullVenues.length > 0) {
      setVisibleVenues(fullVenues as Venue[]);
    }

    if (venues.length === 1) {
      // Single venue — push ?venueId= so VenueMap's Effect 3 fires:
      //   flyTo({ center, zoom: 15 }) then showPopup() after 1.1s.
      // This is the tightest, most focused camera move possible.
      const url = new URL(window.location.href);
      url.searchParams.set('venueId', venues[0].id);
      router.replace(url.pathname + url.search);
      // Clear fitBounds so Effect 4 doesn't fight Effect 3.
      setFitBoundsVenues(undefined);
    } else {
      // Multiple venues — fit them all in the viewport.
      const boundsVenues = venues.map((v) => ({ id: v.id, lat: v.lat, lng: v.lng })) as Venue[];
      setFitBoundsVenues(boundsVenues);
      // Clear venueId so VenueDetailPanel doesn't open for a random venue.
      const url = new URL(window.location.href);
      url.searchParams.delete('venueId');
      router.replace(url.pathname + url.search);
    }
  }, [router]);

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden p-4">
      {/* Header with search bar — onSearch updates visibleVenues */}
      <MapHeader onSearch={handleSearch} />

      {/* Map region — relative so VenueDetailPanel and FloatingChat anchor here */}
      <div className="relative flex-1 min-h-0">
        <Suspense fallback={<MapSkeleton />}>
          <MapContainer 
            initialVenues={visibleVenues} 
            activeVenueId={venueId ?? undefined} 
            fitBoundsVenues={fitBoundsVenues} 
          />
        </Suspense>

        {venueId && <VenueDetailPanel venueId={venueId} />}

        {/* AI assistant — anchored bottom-left of the map region */}
        <FloatingChat onShowVenues={handleShowVenues} />
      </div>
    </div>
  );
}
