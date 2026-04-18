/**
 * POST /functions/v1/get-exercise
 *
 * Fetches an exercise from ExerciseDB based on mood.
 * Body: { mood: Mood }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { Mood, Exercise, MOOD_TO_BODYPART } from '../_shared/types.ts';

const VALID_MOODS: Mood[] = ['happy', 'anxious', 'tired', 'motivated', 'sad'];

const PLACEHOLDERS: Record<Mood, Exercise> = {
  happy:     { id: '0001', name: 'push-up',        bodyPart: 'chest',      equipment: 'body weight', gifUrl: '', target: 'pectorals',            instructions: ['Start in plank.', 'Lower chest to floor.', 'Push back up.', 'Keep core engaged.'] },
  anxious:   { id: '0002', name: 'cat-cow stretch', bodyPart: 'back',       equipment: 'body weight', gifUrl: '', target: 'spine',                instructions: ['Start on all fours.', 'Inhale arch back (cow).', 'Exhale round back (cat).', 'Repeat slowly 1 min.'] },
  tired:     { id: '0003', name: 'neck roll',       bodyPart: 'neck',       equipment: 'body weight', gifUrl: '', target: 'neck',                 instructions: ['Sit tall.', 'Drop right ear to shoulder.', 'Roll chin to chest.', 'Repeat 3x each side.'] },
  motivated: { id: '0004', name: 'squat',           bodyPart: 'upper legs', equipment: 'body weight', gifUrl: '', target: 'quads',                instructions: ['Feet shoulder-width.', 'Push hips back.', 'Chest up, knees over toes.', '3 sets of 15.'] },
  sad:       { id: '0005', name: 'walking',         bodyPart: 'cardio',     equipment: 'body weight', gifUrl: '', target: 'cardiovascular system', instructions: ['Put on shoes.', 'Walk 20 minutes outside.', 'Focus on breathing.', 'Let the rhythm calm you.'] },
};

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

  let mood: Mood;
  try {
    ({ mood } = await req.json());
  } catch {
    return errorResponse('Invalid JSON body');
  }

  if (!VALID_MOODS.includes(mood)) return errorResponse('Invalid mood');

  const apiKey = Deno.env.get('EXERCISEDB_API_KEY');
  if (!apiKey) return jsonResponse(PLACEHOLDERS[mood]);

  const bodyPart = encodeURIComponent(MOOD_TO_BODYPART[mood] ?? 'cardio');

  try {
    const res = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPart}?limit=1`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
        },
      },
    );
    if (!res.ok) return jsonResponse(PLACEHOLDERS[mood]);
    const data = await res.json();
    return jsonResponse(data?.[0] ?? PLACEHOLDERS[mood]);
  } catch {
    return jsonResponse(PLACEHOLDERS[mood]);
  }
});
