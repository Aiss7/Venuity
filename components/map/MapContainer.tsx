'use client';

import { useRouter } from 'next/navigation';
import { VenueMap } from '@/components/map/VenueMap';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// MapContainer — client boundary.
// Receives venues from page.tsx (fetched in a useEffect there) and owns the
// router callback so marker clicks push ?venueId= without re-initialising the map.
// ---------------------------------------------------------------------------

interface MapContainerProps {
  initialVenues: Venue[];
  activeVenueId?: string;
  fitBoundsVenues?: Venue[];
}

export function MapContainer({ initialVenues, activeVenueId, fitBoundsVenues }: MapContainerProps) {
  const router = useRouter();

  function handleVenueClick(id: string) {
    router.push(`?venueId=${id}`);
  }

  return (
    <VenueMap
      initialVenues={initialVenues}
      onVenueClick={handleVenueClick}
      activeVenueId={activeVenueId}
      fitBoundsVenues={fitBoundsVenues}
    />
  );
}
