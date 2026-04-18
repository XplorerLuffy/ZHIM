/**
 * POST /functions/v1/get-meal
 *
 * Fetches a recipe from Spoonacular matching the query.
 * Body: { query: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { SpoonacularRecipe } from '../_shared/types.ts';

const PLACEHOLDER: SpoonacularRecipe = {
  id: 0,
  title: 'Avocado & Quinoa Power Bowl',
  image: '',
  readyInMinutes: 20,
  servings: 2,
  calories: 420,
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

  let query: string;
  try {
    ({ query } = await req.json());
  } catch {
    return errorResponse('Invalid JSON body');
  }

  if (!query || typeof query !== 'string') return errorResponse('query is required');

  const apiKey = Deno.env.get('SPOONACULAR_API_KEY');
  if (!apiKey) return jsonResponse(PLACEHOLDER);

  try {
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=1&addRecipeNutrition=true&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return jsonResponse(PLACEHOLDER);

    const data = await res.json();
    const r = data.results?.[0];
    if (!r) return jsonResponse(PLACEHOLDER);

    const calories = r.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount;
    return jsonResponse({
      id:             r.id,
      title:          r.title,
      image:          r.image,
      readyInMinutes: r.readyInMinutes ?? 30,
      servings:       r.servings ?? 2,
      calories,
    } satisfies SpoonacularRecipe);
  } catch {
    return jsonResponse(PLACEHOLDER);
  }
});
