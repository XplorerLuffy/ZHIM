/**
 * Meal lookup — calls the get-meal Edge Function.
 * Spoonacular API key stays server-side.
 */
import { supabase } from '../lib/supabase';
import type { SpoonacularRecipe } from '../types';

const PLACEHOLDER: SpoonacularRecipe = {
  id: 0,
  title: 'Avocado & Quinoa Power Bowl',
  image: '',
  readyInMinutes: 20,
  servings: 2,
  calories: 420,
  summary: 'A nourishing bowl packed with protein, healthy fats, and complex carbs.',
};

export async function getMealByQuery(query: string): Promise<SpoonacularRecipe | null> {
  if (!query) return PLACEHOLDER;
  try {
    const { data, error } = await supabase.functions.invoke<SpoonacularRecipe>('get-meal', {
      body: { query },
    });
    if (error || !data) return PLACEHOLDER;
    return data;
  } catch {
    return PLACEHOLDER;
  }
}
