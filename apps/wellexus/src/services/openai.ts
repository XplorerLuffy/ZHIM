import OpenAI from 'openai';
import type { WellnessPlanText, Mood } from '../types';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
      dangerouslyAllowBrowser: true,
    });
  }
  return client;
}

const SYSTEM_PROMPT = `You are Wellexus, a compassionate AI wellness companion.
Given a user's mood and intensity (1-5), respond ONLY with a valid JSON object containing exactly these keys:
- meal_suggestion: a healthy meal description (under 60 words)
- workout_suggestion: a workout description (under 60 words)
- mindfulness: a 2-3 sentence mindfulness or breathing exercise
- meal_query: a 1-3 word search term for Spoonacular API (e.g. "buddha bowl", "greek salad")
- workout_query: a single exercise category for ExerciseDB (e.g. "yoga", "cardio", "stretching")

Keep all responses warm, encouraging, and concise.`;

const FALLBACK_PLANS: Record<Mood, WellnessPlanText> = {
  happy: {
    meal_suggestion: 'A vibrant grain bowl with roasted veggies, chickpeas, and tahini dressing — fuel for your great mood!',
    workout_suggestion: 'Celebrate your energy with a 20-minute HIIT session or a fun dance workout.',
    mindfulness: 'Take a moment to feel gratitude for this positive energy. Close your eyes, breathe deeply, and smile. Let this warmth radiate outward.',
    meal_query: 'grain bowl',
    workout_query: 'cardio',
  },
  anxious: {
    meal_suggestion: 'A calming chamomile tea with a warm oatmeal bowl topped with honey and banana — gentle nourishment for a anxious mind.',
    workout_suggestion: 'Gentle yoga or a slow 15-minute stretching routine to release tension from your body.',
    mindfulness: 'Try box breathing: inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 5 times. You are safe, you are grounded.',
    meal_query: 'oatmeal bowl',
    workout_query: 'stretching',
  },
  tired: {
    meal_suggestion: 'An energizing smoothie bowl with spinach, banana, mango and granola — gentle iron and natural sugars to lift you up.',
    workout_suggestion: 'A restorative 10-minute gentle stretch or a slow walk outside for fresh air and light movement.',
    mindfulness: 'Rest is productive. Close your eyes and take 5 slow, deep breaths. Allow your body to soften and restore. You deserve this pause.',
    meal_query: 'smoothie bowl',
    workout_query: 'stretching',
  },
  motivated: {
    meal_suggestion: 'A high-protein chicken and quinoa salad with avocado — the perfect fuel for your drive and ambition today.',
    workout_suggestion: 'Channel that energy into a 30-minute strength training session focusing on compound lifts.',
    mindfulness: 'Harness this momentum with intention. Visualize your goals clearly for 60 seconds. Feel the determination in your chest — it is real and powerful.',
    meal_query: 'quinoa salad',
    workout_query: 'upper%20legs',
  },
  sad: {
    meal_suggestion: 'Warm lentil soup with crusty bread — comfort food packed with mood-boosting B vitamins and serotonin-supporting carbs.',
    workout_suggestion: 'A gentle 15-minute walk outside in nature. Movement releases endorphins and sunlight boosts serotonin.',
    mindfulness: 'It is okay to feel sad. Place one hand on your heart and breathe slowly. Acknowledge your feelings with kindness — this too shall pass.',
    meal_query: 'lentil soup',
    workout_query: 'cardio',
  },
};

export async function generateWellnessPlan(mood: Mood, intensity: number): Promise<WellnessPlanText> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    return FALLBACK_PLANS[mood];
  }

  try {
    const completion = await getClient().chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `My mood is: ${mood} (intensity: ${intensity}/5)` },
      ],
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return FALLBACK_PLANS[mood];

    return JSON.parse(content) as WellnessPlanText;
  } catch {
    return FALLBACK_PLANS[mood];
  }
}
