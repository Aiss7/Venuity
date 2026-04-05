'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  X,
  MapPin,
  Check,
  Bookmark,
  BookmarkCheck,
  Users,
  Banknote,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { getVenueById } from '@/actions/venues';
import { toggleBookmark } from '@/actions/bookmarks';
import { saveToHistory } from '@/lib/history';
import type { Venue, VenueRoom } from '@/types';

// ---------------------------------------------------------------------------
// VenueDetailPanel — Client Component
// ---------------------------------------------------------------------------

interface VenueDetailPanelProps {
  venueId: string;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PanelSkeleton() {
  return (
    <aside className="absolute top-0 right-0 w-[400px] h-full bg-sidebar border-l border-sidebar-border shadow-2xl z-50 flex flex-col">
      <Skeleton className="w-full h-56 rounded-none shrink-0" />
      <div className="p-4 space-y-3 flex-1">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-px w-full mt-4" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// RoomCard — single venue_room rendered inside the "Available Spaces" section
// ---------------------------------------------------------------------------

function RoomCard({ room }: { room: VenueRoom }) {
  const topAmenities = (room.amenities ?? []).slice(0, 4);

  return (
    <Card className="m-4 bg-sidebar-accent/30 border-sidebar-border shadow-none">
      <div className="p-4 space-y-3">

        {/* Header — name + room_type badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm text-foreground leading-snug">
            {room.room_name}
          </p>
          {room.room_type && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {room.room_type}
            </Badge>
          )}
        </div>

        {/* Capacity + Price row */}
        {(room.capacity != null || room.price_note) && (
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            {room.capacity != null && (
              <span className="flex items-center gap-1.5 text-xs">
                <Users size={12} className="shrink-0" />
                Up to {room.capacity} pax
              </span>
            )}
            {room.price_note && (
              <span className="flex items-center gap-1.5 text-xs">
                <Banknote size={12} className="shrink-0" />
                {room.price_note}
              </span>
            )}
          </div>
        )}

        {/* Suitable for — primary-colored outline badges */}
        {room.suitable_for && room.suitable_for.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {room.suitable_for.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-2 py-0.5 text-primary border-primary/30"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Room-level amenities — first 4 with Check icons */}
        {topAmenities.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {topAmenities.map((amenity) => (
              <li key={amenity} className="flex items-center gap-1.5">
                <Check size={12} className="text-primary shrink-0" />
                <span className="text-xs text-foreground/80">{amenity}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Room description */}
        {room.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {room.description}
          </p>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VenueDetailPanel({ venueId }: VenueDetailPanelProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [venue, setVenue]                   = useState<Venue | null>(null);
  const [loading, setLoading]               = useState(true);
  const [isBookmarked, setIsBookmarked]     = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVenue(null);
    setIsBookmarked(false);

    getVenueById(venueId).then(({ data }) => {
      if (!cancelled) {
        setVenue(data);
        setLoading(false);
        if (data) saveToHistory(data);
      }
    });

    return () => { cancelled = true; };
  }, [venueId]);

  async function handleBookmark() {
    if (!venue || bookmarkPending) return;
    setBookmarkPending(true);
    const result = await toggleBookmark(venue.id);
    setBookmarkPending(false);

    if (!result.success) {
      if (result.error === 'unauthorized') {
        router.push(
          `/login?next=${encodeURIComponent(pathname + '?venueId=' + venue.id)}&action=bookmark`,
        );
        return;
      }
      console.error('[VenueDetailPanel] Bookmark error:', result.error);
      return;
    }
    setIsBookmarked(result.isBookmarked);
  }

  if (loading) return <PanelSkeleton />;
  if (!venue)  return null;

  const rooms = venue.venue_rooms ?? [];

  return (
    <aside className="absolute top-0 right-0 w-[400px] h-full bg-sidebar border-l border-sidebar-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-8 duration-300">

      {/* ── Hero image ───────────────────────────────────────────────────── */}
      <div className="relative w-full h-56 shrink-0">
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
        <button
          onClick={() => router.push('/')}
          aria-label="Close venue panel"
          className="absolute top-3 right-3 rounded-full p-1.5 bg-background/80 backdrop-blur text-foreground hover:bg-background transition-colors shadow-md"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <ScrollArea className="h-full flex-1 min-h-0">
        <div className="flex flex-col">

          {/* ── Venue overview ─────────────────────────────────────────── */}
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {venue.name}
            </h2>

            {venue.address && (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                <MapPin size={14} className="shrink-0" />
                <span className="text-xs">{venue.address}</span>
              </div>
            )}

            {/* Category · Rating · Price */}
            <div className="flex flex-wrap gap-2 mt-3">
              {venue.category && (
                <Badge variant="secondary">{venue.category}</Badge>
              )}
              {venue.rating != null && (
                <Badge variant="outline">★ {venue.rating.toFixed(1)}</Badge>
              )}
              {venue.price_range && (
                <Badge variant="secondary">{venue.price_range}</Badge>
              )}
            </div>

            {/* Venue description */}
            {venue.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {venue.description}
              </p>
            )}

            {/* Venue-level event types */}
            {venue.event_types && venue.event_types.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Event Types
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {venue.event_types.map((et) => (
                    <Badge key={et} variant="outline" className="text-xs">
                      {et}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Venue-level amenities summary */}
            {venue.amenities && venue.amenities.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Amenities
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {venue.amenities.join(' · ')}
                </p>
              </div>
            )}
          </div>

          {/* ── Available Spaces ───────────────────────────────────────── */}
          <Separator className="my-4" />

          <h3 className="text-lg font-semibold px-4">Available Spaces</h3>

          {rooms.length === 0 ? (
            <p className="px-4 pt-3 pb-4 text-sm text-muted-foreground">
              No rooms listed for this venue yet.
            </p>
          ) : (
            <div className="pb-2">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Sticky footer — bookmark ─────────────────────────────────────── */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0">
        <Button
          className="w-full"
          size="lg"
          variant={isBookmarked ? 'secondary' : 'default'}
          onClick={handleBookmark}
          disabled={bookmarkPending}
        >
          {isBookmarked ? (
            <>
              <BookmarkCheck size={18} className="mr-2" />
              Bookmarked
            </>
          ) : (
            <>
              <Bookmark size={18} className="mr-2" />
              Bookmark Venue
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
