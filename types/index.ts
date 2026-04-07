// ---------------------------------------------------------------------------
// VenueRoom
// Mirrors the public.venue_rooms child table (one venue → many rooms).
// ---------------------------------------------------------------------------

export interface VenueRoom {
  id: string;
  venue_id: string;
  room_name: string;
  room_type: string | null;
  capacity: number | null;
  price_note: string | null;
  suitable_for: string[] | null;
  amenities: string[] | null;
  event_types: string[] | null;
  description: string | null;
  image_urls: string[] | null;
  is_available: boolean | null;
}

// ---------------------------------------------------------------------------
// Venue
// Mirrors the public.venues parent table exactly.
// amenities, event_types, and description are summary/parent-level fields.
// venue_rooms is populated when using getVenueById (joined select).
// ---------------------------------------------------------------------------

export type PriceRange = '₱' | '₱₱' | '₱₱₱' | '₱₱₱₱';

export interface Venue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  rating: number | null;
  price_range: PriceRange | null;
  amenities: string[] | null;
  event_types: string[] | null;
  image_url: string | null;
  description: string | null;
  address: string | null;
  created_at: string | null;
  // Populated by getVenueById via .select('*, venue_rooms(*)')
  venue_rooms?: VenueRoom[];
}

// ---------------------------------------------------------------------------
// Bookmark — mirrors the public.bookmarks table.
// ---------------------------------------------------------------------------

export interface Bookmark {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// Convenience — Bookmark with the related Venue joined in.
// ---------------------------------------------------------------------------

export interface BookmarkWithVenue extends Bookmark {
  venues: Venue;
}

// ---------------------------------------------------------------------------
// Shared Server Action result wrapper
// ---------------------------------------------------------------------------

export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };
