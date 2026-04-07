'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// getVenues — fetches all rows from public.venues
// Returns { data: Venue[], error: null } on success
//         { data: null, error: string }  on failure
// Never throws — errors are caught and returned as typed values.
// ---------------------------------------------------------------------------

export async function getVenues(): Promise<
  { data: Venue[]; error: null } | { data: null; error: string }
> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true });

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
