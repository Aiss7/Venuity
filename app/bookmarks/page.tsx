import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserBookmarks } from '@/actions/bookmarks';
import { VenueBentoCard } from '@/components/bookmarks/VenueBentoCard';
import { Bookmark } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Bookmarks page — Server Component
// Redirects to /login if no session. Renders a bento grid of bookmarked venues.
// ---------------------------------------------------------------------------

export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/bookmarks');
  }

  const { data: bookmarks } = await getUserBookmarks();

  return (
    <div className="flex flex-col flex-1 h-full overflow-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border shrink-0">
        <Bookmark size={18} className="text-primary" />
        <div>
          <h1 className="text-base font-semibold text-foreground tracking-tight">
            My Bookmarks
          </h1>
          <p className="text-xs text-muted-foreground">
            {bookmarks.length} saved {bookmarks.length === 1 ? 'venue' : 'venues'}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-6">
          <Bookmark size={40} className="text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">No bookmarks yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Search for event venues on the map and hit &ldquo;Bookmark Venue&rdquo; to save them here.
          </p>
        </div>
      ) : (
        /* Bento grid */
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-4 p-6">
          {bookmarks.map((bookmark, index) => (
            <VenueBentoCard
              key={bookmark.id}
              venue={bookmark.venues}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
