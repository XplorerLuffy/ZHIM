/**
 * POST /functions/v1/generate-plan
 *
 * Calls OpenAI GPT-4o and returns wellness plan text.
 * Body: { mood: Mood, intensity: number }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { Mood, WellnessPlanText, FALLBACK_PLANS } from '../_shared/types.ts';

const VALID_MOODS: Mood[] = ['happy', 'anxious', 'tired', 'motivated', 'sad'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse('Missing authorization header', 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse('Unauthorized', 401);

  let mood: Mood, intensity: number;
  try {
    ({ mood, intensity } = await req.json());
  } catch {
    return errorResponse('Invalid JSON body');
  }

  if (!VALID_MOODS.includes(mood)) return errorResponse('Invalid mood');
  if (!Number.isInteger(intensity) || intensity < 1 || intensity > 5) return errorResponse('Intensity must be 1–5');

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return jsonResponse(FALLBACK_PLANS[mood]);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: `You are Wellexus, a compassionate AI wellness companion.
Respond ONLY with valid JSON containing:
- meal_suggestion: healthy meal description (under 60 words)
- workout_suggestion: workout description (under 60 words)
- mindfulness: 2-3 sentence mindfulness exercise
- meal_query: 1-3 word Spoonacular search term
- workout_query: single ExerciseDB body part keyword`,
          },
          { role: 'user', content: `Mood: ${mood}, intensity: ${intensity}/5` },
        ],
      }),
    });

    if (!res.ok) return jsonResponse(FALLBACK_PLANS[mood]);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return jsonResponse(FALLBACK_PLANS[mood]);

    return jsonResponse(JSON.parse(content) as WellnessPlanText);
  } catch {
    return jsonResponse(FALLBACK_PLANS[mood]);
  }
});
