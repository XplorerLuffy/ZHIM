export type Mood = 'happy' | 'anxious' | 'tired' | 'motivated' | 'sad';

export interface WellnessPlanText {
  meal_suggestion: string;
  workout_suggestion: string;
  mindfulness: string;
  meal_query: string;
  workout_query: string;
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  calories?: number;
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

export interface WellnessPlanRequest {
  mood: Mood;
  intensity: number;
}

export interface WellnessPlanResponse {
  plan_id: string;
  mood_log_id: string;
  meal: SpoonacularRecipe | null;
  workout: Exercise | null;
  mindfulness: string;
  meal_suggestion: string;
  workout_suggestion: string;
  date: string;
}

export const MOOD_TO_BODYPART: Record<Mood, string> = {
  anxious:   'back',
  tired:     'neck',
  sad:       'cardio',
  happy:     'chest',
  motivated: 'upper legs',
};

export const FALLBACK_PLANS: Record<Mood, WellnessPlanText> = {
  happy: {
    meal_suggestion:    'A vibrant grain bowl with roasted veggies, chickpeas, and tahini dressing.',
    workout_suggestion: 'Celebrate your energy with a 20-minute HIIT session or a fun dance workout.',
    mindfulness:        'Take a moment to feel gratitude for this positive energy. Close your eyes, breathe deeply, and smile.',
    meal_query:         'grain bowl',
    workout_query:      'cardio',
  },
  anxious: {
    meal_suggestion:    'A calming oatmeal bowl with honey and banana — gentle nourishment for an anxious mind.',
    workout_suggestion: 'Gentle yoga or a slow 15-minute stretching routine to release tension.',
    mindfulness:        'Try box breathing: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 5 times. You are safe.',
    meal_query:         'oatmeal bowl',
    workout_query:      'stretching',
  },
  tired: {
    meal_suggestion:    'An energizing smoothie bowl with spinach, banana, mango and granola.',
    workout_suggestion: 'A restorative 10-minute gentle stretch or a slow walk outside for fresh air.',
    mindfulness:        'Rest is productive. Close your eyes and take 5 slow breaths. Allow your body to restore.',
    meal_query:         'smoothie bowl',
    workout_query:      'stretching',
  },
  motivated: {
    meal_suggestion:    'A high-protein chicken and quinoa salad with avocado — perfect fuel for your drive today.',
    workout_suggestion: 'Channel that energy into a 30-minute strength training session focusing on compound lifts.',
    mindfulness:        'Visualize your goals clearly for 60 seconds. Feel the determination in your chest — it is real.',
    meal_query:         'quinoa salad',
    workout_query:      'upper legs',
  },
  sad: {
    meal_suggestion:    'Warm lentil soup with crusty bread — comfort food packed with mood-boosting B vitamins.',
    workout_suggestion: 'A gentle 15-minute walk outside in nature. Sunlight boosts serotonin.',
    mindfulness:        'It is okay to feel sad. Place one hand on your heart and breathe slowly. This too shall pass.',
    meal_query:         'lentil soup',
    workout_query:      'cardio',
  },
};
