// ---------------------------------------------------------------------------
// Venue
// Mirrors the public.venues table in Supabase exactly.
// price_range is constrained to: '₱' | '₱₱' | '₱₱₱' | '₱₱₱₱'
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
  capacity: number | null;
  amenities: string[] | null;
  image_url: string | null;
  description: string | null;
  address: string | null;
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// Bookmark
// Mirrors the public.bookmarks table in Supabase exactly.
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
