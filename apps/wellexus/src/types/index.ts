export type Mood = 'happy' | 'anxious' | 'tired' | 'motivated' | 'sad';

export interface MoodLog {
  id: string;
  user_id: string;
  mood: Mood;
  intensity: number;
  date: string;
  created_at: string;
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  calories?: number;
  summary?: string;
}

export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  instructions?: string[];
}

export interface WellnessPlanText {
  meal_suggestion: string;
  workout_suggestion: string;
  mindfulness: string;
  meal_query: string;
  workout_query: string;
}

export interface WellnessPlan {
  id: string;
  user_id: string;
  mood_log_id: string;
  meal: SpoonacularRecipe | null;
  workout: Exercise | null;
  mindfulness: string;
  date: string;
  created_at: string;
  completedMeal?: boolean;
  completedWorkout?: boolean;
  completedMindfulness?: boolean;
}

export interface NexiStats {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  streak: number;
  last_active: string | null;
}

export const XP_FOR_MOOD_LOG = 10;
export const XP_FOR_ACTIVITY = 20;

export function xpThreshold(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export const MOOD_EMOJI: Record<Mood, string> = {
  happy:     '😊',
  anxious:   '😰',
  tired:     '😴',
  motivated: '💪',
  sad:       '😔',
};

export const MOOD_LABEL: Record<Mood, string> = {
  happy:     'Happy',
  anxious:   'Anxious',
  tired:     'Tired',
  motivated: 'Motivated',
  sad:       'Sad',
};

export const MOOD_COLOR: Record<Mood, string> = {
  happy:     '#A8EDCA',
  anxious:   '#F5C6B8',
  tired:     '#B8D4F5',
  motivated: '#C9B8F5',
  sad:       '#D4C5E8',
};
