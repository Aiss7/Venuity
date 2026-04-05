'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, MapPin, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getHistory } from '@/lib/history';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// History page — Client Component
// Reads the venuity_history key from localStorage (written by VenueDetailPanel)
// and renders a clean vertical list. The 'Clear History' button wipes the key.
// ---------------------------------------------------------------------------

function timeAgo(isoOrEpoch: string | number): string {
  const ms = typeof isoOrEpoch === 'string' ? Date.parse(isoOrEpoch) : isoOrEpoch;
  if (isNaN(ms)) return '';
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<Venue[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function clearHistory() {
    localStorage.removeItem('venuity_history');
    setHistory([]);
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-auto">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <History size={18} className="text-primary" />
          <div>
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              Browsing History
            </h1>
            <p className="text-xs text-muted-foreground">
              {history.length} {history.length === 1 ? 'venue' : 'venues'} viewed recently
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-destructive"
            onClick={clearHistory}
          >
            <Trash2 size={14} />
            Clear History
          </Button>
        )}
      </div>

      {/* Empty state */}
      {history.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-6">
          <History size={40} className="text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">No browsing history yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Venues you open on the map will appear here automatically.
          </p>
        </div>
      ) : (
        /* Venue list */
        <div className="flex flex-col gap-2 p-6">
          {history.map((venue) => (
            <Link key={venue.id} href={`/?venueId=${venue.id}`}>
              <Card className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group cursor-pointer border-border">
                {/* Thumbnail */}
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {venue.image_url ? (
                    <img
                      src={venue.image_url}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin size={20} className="text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {venue.name}
                  </p>
                  {venue.address && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {venue.address}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {venue.category}
                  </p>
                </div>

                {/* Time */}
                <span className="text-xs text-muted-foreground/60 shrink-0">
                  {timeAgo(venue.created_at ?? Date.now())}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
