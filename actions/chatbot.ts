'use server';

import { generateObject } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import { getVenues } from '@/actions/venues';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const SuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      venue_id: z.string(),
      name: z.string(),
      address: z.string(),
    }),
  ),
});

export type SearchSuggestion = z.infer<typeof SuggestionsSchema>['suggestions'][number];

// ---------------------------------------------------------------------------
// getSearchSuggestions
// Uses Groq + generateObject to rank and return matching venues based on the
// user's natural-language query. The AI is strictly leashed to the DB venue
// list — it cannot hallucinate venues not in the provided context.
// ---------------------------------------------------------------------------

export async function getSearchSuggestions(
  input: string,
): Promise<{ data: SearchSuggestion[]; error: null } | { data: null; error: string }> {
  if (!input.trim()) {
    return { data: [], error: null };
  }

  try {
    const { data: venues, error: venueError } = await getVenues();

    if (venueError || !venues) {
      return { data: null, error: venueError ?? 'Failed to load venues.' };
    }

    // Build a compact venue list for the AI prompt.
    const venueContext = venues
      .map((v) => `ID: ${v.id} | Name: ${v.name} | Category: ${v.category} | Address: ${v.address ?? 'Butuan City'} | Rating: ${v.rating ?? 'N/A'}`)
      .join('\n');

    const { object } = await generateObject({
      model: groq('llama-3.1-70b-versatile'),
      schema: SuggestionsSchema,
      system: `You are a venue discovery assistant for Venuity, an event locator for Butuan City.
You will receive a list of venues from the database and a user search query.
You MUST ONLY return venues from the provided list. Never invent venues not in the list.
If no venues match the query, return an empty suggestions array.
Return the most relevant matches (up to 5) ordered by relevance.`,
      prompt: `Available venues:\n${venueContext}\n\nUser query: "${input}"`,
    });

    return { data: object.suggestions, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    console.error('[getSearchSuggestions] Error:', message);
    return { data: null, error: message };
  }
}
