import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, tool, zodSchema } from 'ai';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/chat
// Vercel AI SDK v6 streaming chat route.
// Fetches the full venue + room dataset from Supabase and injects it as a
// system prompt so Groq can answer questions grounded in real data.
// Returns a UIMessageStream compatible with @ai-sdk/react useChat v6.
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Fetch the complete relational dataset to ground the AI's responses.
  const supabase = await createServerSupabaseClient();
  const { data: venues } = await supabase
    .from('venues')
    .select('*, venue_rooms(*)');

  // Compress to AI-relevant fields only — strips ~19k tokens down to well under 12k TPM.
  const compressedVenues = venues?.map(venue => ({
    name: venue.name,
    category: venue.category,
    price: venue.price_range,
    rooms: venue.venue_rooms.map((room: any) => ({
      name: room.room_name,
      type: room.room_type,
      capacity: room.capacity,
      tags: room.suitable_for,
      amenities: room.amenities,
    })),
  }));

  // Build a lookup map so the AI can resolve name → id/lat/lng/address for tool args.
  // The compressed payload strips coordinates, so we keep a separate geo map.
  const venueGeoMap = Object.fromEntries(
    (venues ?? []).map((v) => [v.name, { id: v.id, lat: v.lat, lng: v.lng, address: v.address }]),
  );

  const systemPrompt =
    `You are the Venuity AI Assistant, an expert event planner for Butuan City. ` +
    `Your job is to recommend the best venues and specific rooms based on user needs (budget, capacity, event type). ` +
    `You must strictly base your recommendations on the following JSON data: ${JSON.stringify(compressedVenues)}. ` +
    `Each venue also has geo data available (use it to fill tool arguments): ${JSON.stringify(venueGeoMap)}. ` +
    `Whenever you recommend one or more specific venues, you MUST call the 'showVenuesOnMap' tool with their IDs and coordinates so the user can see them instantly on the map. ` +
    `If the user asks for the location or address of a specific venue, you must do TWO things: ` +
    `(1) Reply in the chat with the venue's full address from the geo data. ` +
    `(2) Immediately call the 'showVenuesOnMap' tool with that venue's id, name, lat, and lng so the map zooms to it. ` +
    `Mention the specific room name, its capacity, and explain *why* it fits their criteria ` +
    `based on its amenities or 'suitable_for' tags. Do not hallucinate places not in this list. ` +
    `Keep responses concise, friendly, and formatted nicely with markdown. ` +
    `Use simple markdown like bolding and bullet points to make your response easy to read. Do not use large headers (like # or ##).`;

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    // convertToModelMessages converts UIMessage[] → ModelMessage[] for the AI SDK v6
    messages: await convertToModelMessages(messages),
    tools: {
      showVenuesOnMap: tool({
        description:
          'Use this tool to highlight one or multiple venues on the map whenever you recommend them. ' +
          'Call it every time you recommend venues so the user can see them instantly.',
        inputSchema: zodSchema(z.object({
          venues: z.array(z.object({
            id: z.string().describe('The UUID of the venue from the geo-lookup'),
            name: z.string().describe('Human-readable venue name'),
            lat: z.number().describe('Latitude from the geo-lookup'),
            lng: z.number().describe('Longitude from the geo-lookup'),
          })).describe('All venues being recommended in this response'),
        })),
        execute: async (args) => args, // Pass-through — frontend intercepts via onToolCall.
      }),
    },
  });

  // toUIMessageStreamResponse() is the v6 equivalent of toDataStreamResponse()
  // and is compatible with the DefaultChatTransport used by useChat in @ai-sdk/react v6.
  return result.toUIMessageStreamResponse();
}
