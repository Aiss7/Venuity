'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActionResult, Venue } from '@/types';

/**
 * Fetches all venues from the public.venues table, ordered by rating descending.
 *
 * Used by:
 *  - The map page (Server Component) to seed initial markers.
 *  - The AI chatbot action to build the venue context injected into the prompt.
 *
 * @returns ActionResult<Venue[]> — { data: Venue[] } on success, { error } on failure.
 */
export async function getVenues(): Promise<ActionResult<Venue[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('venues')
      .select(
        'id, name, lat, lng, category, rating, price_range, capacity, amenities, image_url, description, address, created_at',
      )
      .order('rating', { ascending: false });

    if (error) {
      console.error('[getVenues] Supabase error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: data as Venue[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    console.error('[getVenues] Unexpected error:', message);
    return { data: null, error: message };
  }
}

/**
 * Fetches a single venue by its UUID.
 *
 * @param id - The UUID of the venue to fetch.
 * @returns ActionResult<Venue> — { data: Venue } on success, { error } on failure.
 */
export async function getVenueById(id: string): Promise<ActionResult<Venue>> {
  if (!id) {
    return { data: null, error: 'Venue ID is required.' };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('venues')
      .select(
        'id, name, lat, lng, category, rating, price_range, capacity, amenities, image_url, description, address, created_at',
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('[getVenueById] Supabase error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: data as Venue, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    console.error('[getVenueById] Unexpected error:', message);
    return { data: null, error: message };
  }
}
