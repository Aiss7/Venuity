'use client';

/**
 * VenueMap.tsx
 *
 * Pure map orchestration: initialises Arenarium + MapLibre, manages marker
 * updates, fly-to, and fit-bounds via four focused effects.
 *
 * All DOM construction and styling lives in ./venueMarkers.ts.
 */

import { useEffect, useRef } from 'react';
import { Map, Marker, LngLatBounds, NavigationControl } from 'maplibre-gl';
import {
  MaplibreProvider,
  MaplibreDarkStyle,
} from '@arenarium/maps-integration-maplibre';
import { MapManager } from '@arenarium/maps';
import 'maplibre-gl/dist/maplibre-gl.css';

import { injectMarkerCSS, buildMarkerPayload } from './venueMarkers';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// Geographic leash — Butuan City   (skill directive §Mapping Integration Rules)
// ---------------------------------------------------------------------------

const BUTUAN_BOUNDS: [[number, number], [number, number]] = [
  [125.4000, 8.8000], // SW [lng, lat]
  [125.7200, 9.0500], // NE [lng, lat]
];
const BUTUAN_CENTER: [number, number] = [125.5350, 8.9475];
const INITIAL_ZOOM = 13;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VenueMapProps {
  initialVenues: Venue[];
  onVenueClick: (id: string) => void;
  activeVenueId?: string;
  /** When set, the viewport fits to show all these venues. */
  fitBoundsVenues?: Venue[];
}

// ---------------------------------------------------------------------------
// VenueMap
// ---------------------------------------------------------------------------

export function VenueMap({
  initialVenues,
  onVenueClick,
  activeVenueId,
  fitBoundsVenues,
}: VenueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<MapManager | null>(null);
  const providerRef = useRef<MaplibreProvider | null>(null);
  // Stable ref — prevents the marker effect from re-firing on every parent re-render.
  const onVenueClickRef = useRef(onVenueClick);
  onVenueClickRef.current = onVenueClick;

  // ── Effect 1: Map init (once on mount) ────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    injectMarkerCSS();

    const provider = new MaplibreProvider(Map, Marker, {
      container: containerRef.current,
      style: MaplibreDarkStyle,
      center: BUTUAN_CENTER,
      zoom: INITIAL_ZOOM,
      maxBounds: BUTUAN_BOUNDS,
    });
    providerRef.current = provider;

    // Zoom controls (+ / −) top-left; compass hidden via CSS in venueMarkers.ts
    provider.getMap().addControl(
      new NavigationControl({ showCompass: false }),
      'top-left',
    );

    MapManager.create(process.env.NEXT_PUBLIC_ARENARIUM_TOKEN ?? '', provider)
      .then((manager) => { managerRef.current = manager; });

    return () => {
      provider.getMap().remove();
      managerRef.current = null;
      providerRef.current = null;
    };
  }, []);

  // ── Effect 2: Marker updates ───────────────────────────────────────────────
  useEffect(() => {
    if (initialVenues.length === 0) return;

    const payload = buildMarkerPayload(
      initialVenues,
      (id) => onVenueClickRef.current(id),
    );

    const push = async (manager: MapManager, provider: MaplibreProvider) => {
      const mlMap = provider.getMap();
      if (!mlMap.isStyleLoaded()) {
        mlMap.once('styledata', () => push(manager, provider));
        return;
      }
      try {
        await manager.removeMarkers();
        await manager.updateMarkers(payload);
        if (initialVenues.length === 1) manager.showPopup(initialVenues[0].id);
      } catch (err) {
        console.warn('[VenueMap] Marker update failed:', err);
      }
    };

    const tryPush = () => {
      const m = managerRef.current;
      const p = providerRef.current;
      if (m && p) push(m, p);
    };

    if (managerRef.current) {
      tryPush();
    } else {
      const poll = setInterval(() => {
        if (managerRef.current) { clearInterval(poll); tryPush(); }
      }, 100);
      setTimeout(() => clearInterval(poll), 5000);
    }
  }, [initialVenues]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: Fly-to + open popup on activeVenueId ───────────────────────
  useEffect(() => {
    if (!activeVenueId) return;
    const target = initialVenues.find((v) => v.id === activeVenueId);
    if (!target) return;

    const flyAndShow = (manager: MapManager, provider: MaplibreProvider) => {
      const mlMap = provider.getMap();
      if (!mlMap.isStyleLoaded()) {
        mlMap.once('styledata', () => flyAndShow(manager, provider));
        return;
      }
      mlMap.flyTo({ center: [target.lng, target.lat], zoom: 15, duration: 1000 });
      setTimeout(() => {
        try { manager.showPopup(activeVenueId); } catch { /* marker may not be placed yet */ }
      }, 1100);
    };

    const tryFly = () => {
      const m = managerRef.current;
      const p = providerRef.current;
      if (m && p) flyAndShow(m, p);
    };

    if (managerRef.current) {
      tryFly();
    } else {
      const poll = setInterval(() => {
        if (managerRef.current) { clearInterval(poll); tryFly(); }
      }, 100);
      setTimeout(() => clearInterval(poll), 5000);
    }
  }, [activeVenueId, initialVenues]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 4: fitBounds for AI multi-venue results ────────────────────────
  useEffect(() => {
    if (!fitBoundsVenues || fitBoundsVenues.length === 0) return;

    const fit = (provider: MaplibreProvider) => {
      const mlMap = provider.getMap();
      if (!mlMap.isStyleLoaded()) {
        mlMap.once('styledata', () => fit(provider));
        return;
      }
      const bounds = new LngLatBounds();
      fitBoundsVenues.forEach((v) => bounds.extend([v.lng, v.lat]));
      mlMap.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 });
    };

    if (providerRef.current) {
      fit(providerRef.current);
    } else {
      const poll = setInterval(() => {
        if (providerRef.current) { clearInterval(poll); fit(providerRef.current!); }
      }, 100);
      setTimeout(() => clearInterval(poll), 5000);
    }
  }, [fitBoundsVenues]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-md overflow-hidden border border-border"
    />
  );
}
