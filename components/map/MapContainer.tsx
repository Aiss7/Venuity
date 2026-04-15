'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { VenueMap } from '@/components/map/VenueMap';
import { RoutePanel } from '@/components/map/RoutePanel';
import { useRouting } from '@/hooks/useRouting';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// MapContainer — client boundary.
// Owns useRouting so VenueMap (polyline) and RoutePanel (step list) both
// get live routing state without lifting it all the way to page.tsx.
//
// page.tsx drives routing by passing a routeTarget prop; a useEffect inside
// this component calls fetchRoute whenever that prop changes.
// ---------------------------------------------------------------------------

interface MapContainerProps {
  initialVenues: Venue[];
  activeVenueId?: string;
  fitBoundsVenues?: Venue[];
  /**
   * When set by page.tsx (user clicked "Get Directions"), MapContainer
   * calls fetchRoute for this destination. Cleared by page.tsx when null.
   */
  routeTarget: { lat: number; lng: number } | null;
}

export function MapContainer({
  initialVenues,
  activeVenueId,
  fitBoundsVenues,
  routeTarget,
}: MapContainerProps) {
  const router = useRouter();

  const {
    routeGeometry,
    routeSteps,
    userLocation,
    totalDistance,
    totalDuration,
    isLoading: routeLoading,
    error: routeError,
    fetchRoute,
    clearRoute,
  } = useRouting();

  // Track the last target we fetched so we don't re-fire on unrelated re-renders.
  const lastTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!routeTarget) {
      // routeTarget was cleared externally (e.g. user closed panel) — no action
      // needed; clearRoute is called by RoutePanel's onClose propagated up.
      return;
    }
    const key = `${routeTarget.lng},${routeTarget.lat}`;
    if (key === lastTargetRef.current) return; // same destination — skip
    lastTargetRef.current = key;
    fetchRoute(routeTarget.lng, routeTarget.lat);
  }, [routeTarget, fetchRoute]);

  function handleVenueClick(id: string) {
    router.push(`?venueId=${id}`);
  }

  const showRoutePanel =
    routeLoading || routeError !== null || routeSteps.length > 0;

  const destinationCoords: [number, number] | null = routeTarget
    ? [routeTarget.lng, routeTarget.lat]
    : null;

  return (
    <>
      <VenueMap
        initialVenues={initialVenues}
        onVenueClick={handleVenueClick}
        activeVenueId={activeVenueId}
        fitBoundsVenues={fitBoundsVenues}
        routeGeometry={routeGeometry}
        userLocation={userLocation}
        destinationCoords={destinationCoords}
      />

      {showRoutePanel && (
        <RoutePanel
          steps={routeSteps}
          totalDistance={totalDistance}
          totalDuration={totalDuration}
          isLoading={routeLoading}
          error={routeError}
          onClose={() => {
            clearRoute();
            lastTargetRef.current = null;
          }}
        />
      )}
    </>
  );
}
