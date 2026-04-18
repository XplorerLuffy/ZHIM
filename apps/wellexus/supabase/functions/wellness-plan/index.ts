/**
 * POST /functions/v1/wellness-plan
 *
 * Full server-side orchestration:
 *   1. Verify Supabase JWT
 *   2. Validate mood + intensity
 *   3. INSERT mood_log
 *   4. Call OpenAI GPT-4o → wellness plan text
 *   5. Parallel: Spoonacular meal + ExerciseDB workout
 *   6. INSERT plan to Supabase
 *   7. Update nexi_stats XP
 *   8. Return complete plan
 *
 * All API keys stay server-side — never sent to the client.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import {
  Mood,
  WellnessPlanText,
  SpoonacularRecipe,
  Exercise,
  WellnessPlanRequest,
  MOOD_TO_BODYPART,
  FALLBACK_PLANS,
} from '../_shared/types.ts';

const VALID_MOODS: Mood[] = ['happy', 'anxious', 'tired', 'motivated', 'sad'];
const XP_FOR_MOOD_LOG = 10;

// ─── OpenAI ──────────────────────────────────────────────────────────────────

async function generatePlan(mood: Mood, intensity: number): Promise<WellnessPlanText> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return FALLBACK_PLANS[mood];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: `You are Wellexus, a compassionate AI wellness companion.
Given a user's mood and intensity (1-5), respond ONLY with a valid JSON object with exactly:
- meal_suggestion: healthy meal description (under 60 words)
- workout_suggestion: workout description (under 60 words)
- mindfulness: 2-3 sentence mindfulness or breathing exercise
- meal_query: 1-3 word Spoonacular search term (e.g. "buddha bowl")
- workout_query: single ExerciseDB body part (e.g. "cardio", "back", "chest")
Keep all responses warm and encouraging.`,
          },
          {
            role: 'user',
            content: `My mood is: ${mood} (intensity: ${intensity}/5)`,
          },
        ],
      }),
    });

    if (!res.ok) return FALLBACK_PLANS[mood];
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return FALLBACK_PLANS[mood];

    return JSON.parse(content) as WellnessPlanText;
  } catch {
    return FALLBACK_PLANS[mood];
  }
}

// ─── Spoonacular ─────────────────────────────────────────────────────────────

async function getMeal(query: string): Promise<SpoonacularRecipe | null> {
  const apiKey = Deno.env.get('SPOONACULAR_API_KEY');
  if (!apiKey) return PLACEHOLDER_MEAL;

  try {
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=1&addRecipeNutrition=true&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return PLACEHOLDER_MEAL;

    const data = await res.json();
    const r = data.results?.[0];
    if (!r) return PLACEHOLDER_MEAL;

    const calories = r.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount;
    return {
      id: r.id,
      title: r.title,
      image: r.image,
      readyInMinutes: r.readyInMinutes ?? 30,
      servings: r.servings ?? 2,
      calories,
    };
  } catch {
    return PLACEHOLDER_MEAL;
  }
}

const PLACEHOLDER_MEAL: SpoonacularRecipe = {
  id: 0,
  title: 'Avocado & Quinoa Power Bowl',
  image: '',
  readyInMinutes: 20,
  servings: 2,
  calories: 420,
};

// ─── ExerciseDB ───────────────────────────────────────────────────────────────

async function getExercise(mood: Mood): Promise<Exercise | null> {
  const apiKey = Deno.env.get('EXERCISEDB_API_KEY');
  const bodyPart = encodeURIComponent(MOOD_TO_BODYPART[mood] ?? 'cardio');

  if (!apiKey) return PLACEHOLDER_EXERCISES[mood];

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
    if (!res.ok) return PLACEHOLDER_EXERCISES[mood];
    const data = await res.json();
    return data?.[0] ?? PLACEHOLDER_EXERCISES[mood];
  } catch {
    return PLACEHOLDER_EXERCISES[mood];
  }
}

const PLACEHOLDER_EXERCISES: Record<Mood, Exercise> = {
  happy:     { id: '0001', name: 'push-up',        bodyPart: 'chest',      equipment: 'body weight', gifUrl: '', target: 'pectorals',           instructions: ['Start in plank.', 'Lower chest to floor.', 'Push back up.', 'Keep core engaged.'] },
  anxious:   { id: '0002', name: 'cat-cow stretch', bodyPart: 'back',       equipment: 'body weight', gifUrl: '', target: 'spine',               instructions: ['Start on hands and knees.', 'Inhale and arch back (cow).', 'Exhale and round back (cat).', 'Repeat slowly for 1 minute.'] },
  tired:     { id: '0003', name: 'neck roll',       bodyPart: 'neck',       equipment: 'body weight', gifUrl: '', target: 'neck',                instructions: ['Sit with spine tall.', 'Drop right ear to shoulder.', 'Roll chin to chest.', 'Continue to left. Repeat 3x.'] },
  motivated: { id: '0004', name: 'squat',           bodyPart: 'upper legs', equipment: 'body weight', gifUrl: '', target: 'quads',               instructions: ['Feet shoulder-width apart.', 'Push hips back, bend knees.', 'Chest up, knees over toes.', '3 sets of 15 reps.'] },
  sad:       { id: '0005', name: 'walking',         bodyPart: 'cardio',     equipment: 'body weight', gifUrl: '', target: 'cardiovascular system', instructions: ['Put on comfortable shoes.', 'Walk at a comfortable pace for 20 minutes.', 'Focus on breathing.', 'Let the rhythm calm your mind.'] },
};

// ─── XP helpers ──────────────────────────────────────────────────────────────

function xpThreshold(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function computeNewXP(currentXP: number, currentLevel: number, earned: number) {
  const newXP = currentXP + earned;
  const threshold = xpThreshold(currentLevel);
  if (newXP >= threshold) {
    return { xp: newXP - threshold, level: currentLevel + 1 };
  }
  return { xp: newXP, level: currentLevel };
}

function computeStreak(lastActive: string | null): number {
  if (!lastActive) return 1;
  const last = new Date(lastActive);
  const today = new Date();
  last.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  if (diffDays === 0) return 0; // already logged today, don't increment
  if (diffDays === 1) return 1; // consecutive day
  return -1; // streak broken
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  // Verify auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse('Missing authorization header', 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse('Unauthorized', 401);

  // Parse + validate body
  let body: WellnessPlanRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { mood, intensity } = body;
  if (!VALID_MOODS.includes(mood)) return errorResponse(`Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}`);
  if (!Number.isInteger(intensity) || intensity < 1 || intensity > 5) return errorResponse('Intensity must be an integer 1–5');

  try {
    // 1. Insert mood log
    const { data: moodLog, error: moodErr } = await supabase
      .from('mood_logs')
      .insert({ user_id: user.id, mood, intensity })
      .select('id, date')
      .single();

    if (moodErr) throw new Error(`mood_logs insert: ${moodErr.message}`);

    // 2. Generate GPT-4 plan text
    const planText = await generatePlan(mood, intensity);

    // 3. Fetch meal + exercise in parallel
    const [meal, workout] = await Promise.all([
      getMeal(planText.meal_query),
      getExercise(mood),
    ]);

    // 4. Insert plan
    const { data: savedPlan, error: planErr } = await supabase
      .from('plans')
      .insert({
        user_id:     user.id,
        mood_log_id: moodLog.id,
        meal,
        workout,
        mindfulness: planText.mindfulness,
      })
      .select('id, date')
      .single();

    if (planErr) throw new Error(`plans insert: ${planErr.message}`);

    // 5. Update nexi_stats (XP + streak)
    const { data: nexiRow } = await supabase
      .from('nexi_stats')
      .select('xp, level, streak, last_active')
      .eq('user_id', user.id)
      .single();

    if (nexiRow) {
      const { xp: newXP, level: newLevel } = computeNewXP(nexiRow.xp, nexiRow.level, XP_FOR_MOOD_LOG);
      const streakDelta = computeStreak(nexiRow.last_active);
      const newStreak = streakDelta === -1
        ? 1
        : streakDelta === 0
        ? nexiRow.streak
        : nexiRow.streak + 1;

      await supabase
        .from('nexi_stats')
        .update({
          xp:          newXP,
          level:       newLevel,
          streak:      newStreak,
          last_active: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);
    }

    // 6. Return full plan
    return jsonResponse({
      plan_id:           savedPlan.id,
      mood_log_id:       moodLog.id,
      meal,
      workout,
      mindfulness:       planText.mindfulness,
      meal_suggestion:   planText.meal_suggestion,
      workout_suggestion: planText.workout_suggestion,
      date:              savedPlan.date,
    });
  } catch (err) {
    console.error('wellness-plan error:', err);
    return errorResponse('Internal server error', 500);
  }
});
