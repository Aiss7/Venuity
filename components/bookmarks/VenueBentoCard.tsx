'use client';

import { useRouter } from 'next/navigation';
import { Star, MapPin, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// VenueBentoCard — used in the Bookmarks bento grid.
// Displays: background image, name, category badge, rating, and price_range.
// capacity and amenities have moved to VenueRoom — not referenced here.
// ---------------------------------------------------------------------------

interface VenueBentoCardProps {
  venue: Venue;
  index: number;
}

export function VenueBentoCard({ venue, index }: VenueBentoCardProps) {
  const router = useRouter();
  const isLarge = index % 3 === 0;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`View details for ${venue.name}`}
      onClick={() => router.push(`/?venueId=${venue.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/?venueId=${venue.id}`)}
      className={[
        'group relative rounded-xl overflow-hidden cursor-pointer',
        isLarge ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1',
      ].join(' ')}
    >
      {/* Background image */}
      {venue.image_url ? (
        <img
          src={venue.image_url}
          alt={venue.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      {/* Ring on hover */}
      <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 group-hover:ring-primary transition-all duration-200" />

      {/* ── Top row: category badge + directions button ───────────────────── */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
        <Badge
          variant="secondary"
          className="bg-black/60 text-white border-0 backdrop-blur-sm text-xs"
        >
          {venue.category}
        </Badge>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Get directions to ${venue.name}`}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-primary hover:text-primary-foreground transition-colors shadow-md shrink-0"
        >
          <Navigation size={13} />
        </a>
      </div>

      {/* ── Bottom: name + rating + price_range ──────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-semibold text-sm leading-tight truncate">
          {venue.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {venue.rating != null && (
            <div className="flex items-center gap-1">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white/80 text-xs">{venue.rating.toFixed(1)}</span>
            </div>
          )}
          {venue.price_range && (
            <span className="text-white/60 text-xs">{venue.price_range}</span>
          )}
        </div>
        {!venue.image_url && venue.address && (
          <div className="flex items-center gap-1 mt-1 text-white/50">
            <MapPin size={10} />
            <span className="text-xs truncate">{venue.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}
