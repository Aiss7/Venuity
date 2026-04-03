'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, MapPin, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getVenueById } from '@/actions/venues';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// VenueDetailPanel — Client Component
// Fetches and displays venue details in an absolute overlay panel.
// Uses useEffect so the panel can be rendered alongside the map without
// blocking the Server Component tree.
// ---------------------------------------------------------------------------

interface VenueDetailPanelProps {
  venueId: string;
}

// ---------------------------------------------------------------------------
// Loading skeleton — mirrors the real layout so there's no layout shift
// ---------------------------------------------------------------------------

function PanelSkeleton() {
  return (
    <aside className="absolute top-0 right-0 w-[400px] h-full bg-sidebar border-l border-sidebar-border shadow-2xl z-50 flex flex-col">
      {/* Hero */}
      <Skeleton className="w-full h-64 rounded-none shrink-0" />
      <div className="p-4 space-y-4 flex-1">
        {/* Name */}
        <Skeleton className="h-7 w-3/4" />
        {/* Address */}
        <Skeleton className="h-4 w-1/2" />
        {/* Badges */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        {/* Description lines */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        {/* Amenities */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-28" />
          ))}
        </div>
      </div>
      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border shrink-0">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VenueDetailPanel({ venueId }: VenueDetailPanelProps) {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVenue(null);

    getVenueById(venueId).then(({ data }) => {
      if (!cancelled) {
        setVenue(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  if (loading) return <PanelSkeleton />;
  if (!venue) return null;

  return (
    <aside className="absolute top-0 right-0 w-[400px] h-full bg-sidebar border-l border-sidebar-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-8 duration-300">

      {/* ------------------------------------------------------------------ */}
      {/* Hero image with overlaid close button                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full h-64 shrink-0">
        {venue.image_url ? (
          <img
            src={venue.image_url}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MapPin size={40} className="text-muted-foreground/40" />
          </div>
        )}

        {/* Close button — top-right corner, frosted */}
        <button
          onClick={() => router.push('/')}
          aria-label="Close venue panel"
          className="absolute top-3 right-3 rounded-full p-1.5 bg-background/80 backdrop-blur text-foreground hover:bg-background transition-colors shadow-md"
        >
          <X size={18} />
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Scrollable body                                                     */}
      {/* ------------------------------------------------------------------ */}
      <ScrollArea className="h-full flex-1 min-h-0">
        <div className="flex flex-col">
          {/* Venue name */}
          <h2 className="text-2xl font-bold px-4 pt-4 pb-1 text-foreground">
            {venue.name}
          </h2>

          {/* Address */}
          {venue.address && (
            <div className="flex items-center gap-1.5 px-4 pb-4 text-muted-foreground">
              <MapPin size={16} className="shrink-0" />
              <span className="text-sm">{venue.address}</span>
            </div>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {venue.category && (
              <Badge variant="secondary">{venue.category}</Badge>
            )}
            {venue.capacity != null && (
              <Badge variant="secondary">{venue.capacity} pax</Badge>
            )}
            {venue.price_range && (
              <Badge variant="secondary">{venue.price_range}</Badge>
            )}
            {venue.rating != null && (
              <Badge variant="outline">★ {venue.rating.toFixed(1)}</Badge>
            )}
          </div>

          {/* Description */}
          {venue.description && (
            <p className="text-foreground text-sm px-4 pb-4 leading-relaxed">
              {venue.description}
            </p>
          )}

          {/* Amenities */}
          {venue.amenities && venue.amenities.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Amenities
              </h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {venue.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2">
                    <CheckCircle2
                      size={16}
                      className="text-primary shrink-0"
                    />
                    <span className="text-sm text-foreground/80">{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ------------------------------------------------------------------ */}
      {/* Sticky footer                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0">
        <Button className="w-full" size="lg">
          Bookmark Venue
        </Button>
      </div>
    </aside>
  );
}
