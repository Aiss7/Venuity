'use client';

// ---------------------------------------------------------------------------
// useRouting — fetches a driving route from the public OSRM API using the
// browser Geolocation API as the origin.
//
// Usage:
//   const { fetchRoute, clearRoute, routeGeometry, routeSteps,
//           userLocation, totalDistance, totalDuration,
//           isLoading, error } = useRouting();
//
//   // Trigger when the user clicks "Get Directions":
//   fetchRoute(venue.lng, venue.lat);
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react';
import type { RouteGeometry, OsrmStep, OsrmResponse } from '@/types/routing';

// OSRM public routing API — no auth required, adequate for MVP.
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

interface RoutingState {
  routeGeometry: RouteGeometry | null;
  routeSteps: OsrmStep[];
  userLocation: [number, number] | null; // [lng, lat]
  totalDistance: number;  // metres
  totalDuration: number;  // seconds
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: RoutingState = {
  routeGeometry: null,
  routeSteps: [],
  userLocation: null,
  totalDistance: 0,
  totalDuration: 0,
  isLoading: false,
  error: null,
};

export function useRouting() {
  const [state, setState] = useState<RoutingState>(INITIAL_STATE);

  /**
   * Requests the user's location via Geolocation API, then fetches
   * a driving route from the user's position to the given destination.
   */
  const fetchRoute = useCallback((destinationLng: number, destinationLat: number) => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    // Start loading immediately so the RoutePanel can show a spinner.
    setState({ ...INITIAL_STATE, isLoading: true });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLng = position.coords.longitude;
        const userLat = position.coords.latitude;

        const url =
          `${OSRM_BASE}/${userLng},${userLat};${destinationLng},${destinationLat}` +
          '?steps=true&geometries=geojson&overview=full';

        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`OSRM returned HTTP ${res.status}`);
          }

          const json: OsrmResponse = await res.json();

          if (json.code !== 'Ok' || json.routes.length === 0) {
            throw new Error('No route found between your location and the destination.');
          }

          const route = json.routes[0];
          // Flatten all steps across all legs into a single list.
          const steps = route.legs.flatMap((leg) => leg.steps);

          setState({
            routeGeometry: route.geometry,
            routeSteps: steps,
            userLocation: [userLng, userLat],
            totalDistance: route.distance,
            totalDuration: route.duration,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to fetch route. Please try again.';
          setState({ ...INITIAL_STATE, error: message });
        }
      },
      (geoError) => {
        let message = 'Unable to retrieve your location.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          message = 'Location access denied. Please allow location access and try again.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable.';
        } else if (geoError.code === geoError.TIMEOUT) {
          message = 'Location request timed out. Please try again.';
        }
        setState({ ...INITIAL_STATE, error: message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  /** Clears all route state — call this when the user closes the RoutePanel. */
  const clearRoute = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { ...state, fetchRoute, clearRoute };
}
