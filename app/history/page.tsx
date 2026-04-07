'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, MapPin, Trash2, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHistory } from '@/lib/history';
import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// History page — Client Component
// Reads the venuity_history key from localStorage (written by VenueDetailPanel)
// ---------------------------------------------------------------------------

function formatTimestamp(isoOrEpoch: string | number): string {
  const ms = typeof isoOrEpoch === 'string' ? Date.parse(isoOrEpoch) : isoOrEpoch;
  if (isNaN(ms)) return '';
  const date = new Date(ms);
  
  const today = new Date();
  const isToday = date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
    
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  
  if (isToday) {
    return `Viewed today at ${timeStr}`;
  }
  
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `Viewed ${dateStr} at ${timeStr}`;
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
    <div className="flex flex-col flex-1 h-full overflow-auto p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Recent Searches
        </h1>
        {history.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={clearHistory}
            className="gap-2"
          >
            <Trash2 size={16} />
            Clear History
          </Button>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center mt-8 border-dashed shadow-sm">
          <History size={48} className="text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-foreground">No recent searches</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start exploring the map!
          </p>
        </Card>
      ) : (
        /* List Layout */
        <div className="space-y-4">
          {history.map((venue) => (
            <Card key={venue.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors shadow-sm">
              {/* Left Side (Details) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground text-lg leading-none">{venue.name}</span>
                  {venue.category && (
                    <Badge variant="secondary" className="px-2 py-0.5 font-medium rounded-sm">
                      {venue.category}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock size={14} className="opacity-70" />
                  <span>{formatTimestamp(venue.created_at ?? Date.now())}</span>
                </div>
              </div>

              {/* Right Side (Action) */}
              <Link href={`/?venueId=${venue.id}`}>
                <Button variant="secondary" size="icon" className="rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all">
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
