import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages } from 'ai';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
      amenities: room.amenities
    }))
  }));

  const systemPrompt =
    `You are the Venuity AI Assistant, an expert event planner for Butuan City. ` +
    `Your job is to recommend the best venues and specific rooms based on user needs (budget, capacity, event type). ` +
    `You must strictly base your recommendations on the following JSON data: ${JSON.stringify(compressedVenues)}. ` +
    `When recommending a place, mention the specific room name, its capacity, and explain *why* it fits their criteria ` +
    `based on its amenities or 'suitable_for' tags. Do not hallucinate places not in this list. ` +
    `Keep responses concise, friendly, and formatted nicely with markdown. ` +
    `Use simple markdown like bolding and bullet points to make your response easy to read. Do not use large headers (like # or ##).`;

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    // convertToModelMessages converts UIMessage[] → ModelMessage[] for the AI SDK v6
    messages: await convertToModelMessages(messages),
  });

  // toUIMessageStreamResponse() is the v6 equivalent of toDataStreamResponse()
  // and is compatible with the DefaultChatTransport used by useChat in @ai-sdk/react v6.
  return result.toUIMessageStreamResponse();
}
