/**
 * Type-safe wrapper for the wellness-plan Edge Function response.
 * The actual call lives in useMoodLog.ts — this file only exports types
 * so other parts of the app can reference the shape without coupling to the hook.
 */
import type { SpoonacularRecipe, Exercise } from '../types';

export interface WellnessPlanResponse {
  plan_id:            string;
  mood_log_id:        string;
  meal:               SpoonacularRecipe | null;
  workout:            Exercise | null;
  mindfulness:        string;
  meal_suggestion:    string;
  workout_suggestion: string;
  date:               string;
}
