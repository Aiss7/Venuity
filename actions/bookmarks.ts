'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { BookmarkWithVenue } from '@/types';

// ---------------------------------------------------------------------------
// getUserBookmarks
// Returns all bookmarks for the current user, joined with venue data.
// Returns an empty array (not an error) when not authenticated.
// ---------------------------------------------------------------------------

export async function getUserBookmarks(): Promise<{
  data: BookmarkWithVenue[];
  error: string | null;
}> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], error: null };

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, user_id, venue_id, created_at, venues(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getUserBookmarks] Supabase error:', error.message);
    return { data: [], error: error.message };
  }

  return { data: (data as unknown as BookmarkWithVenue[]) ?? [], error: null };
}



// ---------------------------------------------------------------------------
// toggleBookmark
// Adds or removes a bookmark for the authenticated user.
//
// Returns:
//   { success: true,  isBookmarked: boolean } — on success
//   { success: false, error: 'unauthorized' }  — when no session exists
//   { success: false, error: string }           — on DB error
// ---------------------------------------------------------------------------

export async function toggleBookmark(venueId: string): Promise<
  | { success: true; isBookmarked: boolean }
  | { success: false; error: string }
> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'unauthorized' };
  }

  // Check if the bookmark already exists.
  const { data: existing, error: selectError } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('venue_id', venueId)
    .maybeSingle();

  if (selectError) {
    console.error('[toggleBookmark] Select error:', selectError.message);
    return { success: false, error: selectError.message };
  }

  if (existing) {
    // Already bookmarked → remove it.
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.error('[toggleBookmark] Delete error:', deleteError.message);
      return { success: false, error: deleteError.message };
    }

    return { success: true, isBookmarked: false };
  }

  // Not bookmarked yet → insert it.
  const { error: insertError } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, venue_id: venueId });

  if (insertError) {
    console.error('[toggleBookmark] Insert error:', insertError.message);
    return { success: false, error: insertError.message };
  }

  return { success: true, isBookmarked: true };
}
