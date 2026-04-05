'use client';

import { useEffect, useRef } from 'react';
import { Map, Marker } from 'maplibre-gl';
import {
  MaplibreProvider,
  MaplibreDarkStyle,
} from '@arenarium/maps-integration-maplibre';
import { MapManager } from '@arenarium/maps';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// Butuan City geographic leash — skill directive §Mapping Integration Rules
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
}

// ---------------------------------------------------------------------------
// DOM element builders — imperative API required by @arenarium/maps
// ---------------------------------------------------------------------------

function buildPinElement(): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 16px;
    height: 16px;
    background: hsl(var(--primary));
    border-radius: 50%;
    border: 2px solid hsl(var(--background));
    box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    flex-shrink: 0;
  `;
  return el;
}

function buildTooltipElement(venue: Venue): HTMLElement {
  const el = document.createElement('div');
  el.className =
    'flex items-center gap-2 bg-zinc-950 text-white px-3 py-1.5 rounded-lg shadow-lg border border-zinc-800';
  el.innerHTML = `
    <span class="font-medium text-xs">${venue.name}</span>
    <span class="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-md font-bold">
      ${venue.rating ?? '—'}
    </span>
  `;
  return el;
}

function buildPopupElement(
  venue: Venue,
  onVenueClick: (id: string) => void,
): HTMLElement {
  const el = document.createElement('div');
  el.className =
    'flex flex-col bg-zinc-950 text-white rounded-xl shadow-2xl border border-zinc-800 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all';
  el.innerHTML = `
    <div class="p-2">
      <img
        src="${venue.image_url ?? ''}"
        alt="${venue.name}"
        class="w-full h-28 object-cover rounded-lg"
        onerror="this.style.display='none'"
      />
    </div>
    <div class="p-3">
      <span class="text-xs font-bold text-primary uppercase tracking-wider">
        ${venue.category}
      </span>
      <div class="font-bold text-sm mt-0.5">${venue.name}</div>
      <div class="text-zinc-400 text-xs mt-1">
        ${venue.price_range ?? ''}
      </div>
    </div>
  `;
  el.addEventListener('click', () => onVenueClick(venue.id));
  return el;
}

// ---------------------------------------------------------------------------
// buildMarkerPayload — shared helper used by both effects
// ---------------------------------------------------------------------------

function buildMarkerPayload(
  venues: Venue[],
  onVenueClick: (id: string) => void,
) {
  return venues.map((venue, index) => ({
    id: venue.id,
    rank: index,
    lat: venue.lat,
    lng: venue.lng,
    tooltip: {
      element: buildTooltipElement(venue),
      dimensions: { width: 140, height: 32, padding: 4 },
    },
    pin: {
      element: buildPinElement(),
      dimensions: { radius: 8, stroke: 2 },
    },
    popup: {
      element: buildPopupElement(venue, onVenueClick),
      dimensions: { width: 220, height: 200, padding: 8 },
    },
  }));
}

// ---------------------------------------------------------------------------
// VenueMap
// ---------------------------------------------------------------------------

export function VenueMap({ initialVenues, onVenueClick, activeVenueId }: VenueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<MapManager | null>(null);
  const providerRef = useRef<MaplibreProvider | null>(null);
  // Keep onVenueClick stable in a ref so the marker effect doesn't re-fire
  // every time the parent re-renders with a new function reference.
  const onVenueClickRef = useRef(onVenueClick);
  onVenueClickRef.current = onVenueClick;

  // -------------------------------------------------------------------------
  // Effect 1 — Map initialisation (runs once on mount).
  // Creates the MaplibreProvider + MapManager and stores both in refs.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_ARENARIUM_TOKEN ?? '';

    const provider = new MaplibreProvider(Map, Marker, {
      container: containerRef.current,
      style: MaplibreDarkStyle,
      center: BUTUAN_CENTER,
      zoom: INITIAL_ZOOM,
      maxBounds: BUTUAN_BOUNDS,
    });
    providerRef.current = provider;

    MapManager.create(apiKey, provider).then((manager) => {
      managerRef.current = manager;
    });

    // Cleanup — skill directive §Mapping Integration Rules
    return () => {
      provider.getMap().remove();
      managerRef.current = null;
      providerRef.current = null;
    };
  }, []); // Intentionally empty — map is initialised once.

  // -------------------------------------------------------------------------
  // Effect 2 — Marker updates (runs whenever initialVenues changes).
  // Calls manager.updateMarkers() on the existing manager instance.
  // Waits for the map's 'load' event if the map isn't ready yet.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (initialVenues.length === 0) return;

    const payload = buildMarkerPayload(initialVenues, (id) =>
      onVenueClickRef.current(id),
    );

    const pushMarkers = async (manager: MapManager) => {
      try {
        await manager.removeMarkers();
        await manager.updateMarkers(payload);

        // Auto-open popup when the search selected exactly one venue.
        if (initialVenues.length === 1) {
          manager.showPopup(initialVenues[0].id);
        }
      } catch (err) {
        console.error('[VenueMap] Failed to update markers:', err);
      }
    };

    const tryPush = () => {
      const manager = managerRef.current;
      const provider = providerRef.current;
      if (!manager || !provider) return;

      const mlMap = provider.getMap();
      if (mlMap.loaded()) {
        pushMarkers(manager);
      } else {
        mlMap.once('load', () => pushMarkers(manager));
      }
    };

    // Manager may not exist yet on the very first render (map still
    // initialising). Poll briefly — the map auth handshake is <500ms.
    if (managerRef.current) {
      tryPush();
    } else {
      const poll = setInterval(() => {
        if (managerRef.current) {
          clearInterval(poll);
          tryPush();
        }
      }, 100);
      // Give up after 5s to avoid memory leaks.
      setTimeout(() => clearInterval(poll), 5000);
    }
  }, [initialVenues]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Effect 3 — Auto-zoom + popup when activeVenueId changes.
  // If the target venue is in the current marker set, fly to it and open its
  // popup. Waits for the manager via the same poll pattern as Effect 2.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!activeVenueId) return;

    const target = initialVenues.find((v) => v.id === activeVenueId);
    if (!target) return;

    const tryFlyAndShow = () => {
      const manager = managerRef.current;
      const provider = providerRef.current;
      if (!manager || !provider) return;

      const mlMap = provider.getMap();

      const flyAndShow = () => {
        mlMap.flyTo({ center: [target.lng, target.lat], zoom: 15, duration: 1000 });
        setTimeout(() => {
          try { manager.showPopup(activeVenueId); } catch { /* marker may not be ready */ }
        }, 1100); // wait for fly animation to finish
      };

      if (mlMap.loaded()) {
        flyAndShow();
      } else {
        mlMap.once('load', flyAndShow);
      }
    };

    if (managerRef.current) {
      tryFlyAndShow();
    } else {
      const poll = setInterval(() => {
        if (managerRef.current) { clearInterval(poll); tryFlyAndShow(); }
      }, 100);
      setTimeout(() => clearInterval(poll), 5000);
    }
  }, [activeVenueId, initialVenues]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-md overflow-hidden border border-border"
    />
  );
}
