import type { Exercise, Mood } from '../types';

const BASE = 'https://exercisedb.p.rapidapi.com';

const MOOD_TO_BODYPART: Record<Mood, string> = {
  anxious:   'back',
  tired:     'neck',
  sad:       'cardio',
  happy:     'chest',
  motivated: 'upper%20legs',
};

export async function getExerciseByMood(mood: Mood): Promise<Exercise | null> {
  const apiKey = process.env.EXPO_PUBLIC_EXERCISEDB_API_KEY;
  if (!apiKey) {
    return PLACEHOLDER_EXERCISES[mood] ?? PLACEHOLDER_EXERCISES.happy;
  }

  const bodyPart = MOOD_TO_BODYPART[mood] ?? 'cardio';

  try {
    const res = await fetch(`${BASE}/exercises/bodyPart/${bodyPart}?limit=1`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    });
    if (!res.ok) return PLACEHOLDER_EXERCISES[mood] ?? null;

    const data: Exercise[] = await res.json();
    return data?.[0] ?? PLACEHOLDER_EXERCISES[mood] ?? null;
  } catch {
    return PLACEHOLDER_EXERCISES[mood] ?? null;
  }
}

const PLACEHOLDER_EXERCISES: Record<Mood, Exercise> = {
  happy: {
    id: '0001',
    name: 'push-up',
    bodyPart: 'chest',
    equipment: 'body weight',
    gifUrl: '',
    target: 'pectorals',
    instructions: [
      'Start in a plank position with hands shoulder-width apart.',
      'Lower your chest to the floor by bending your elbows.',
      'Push back up to starting position.',
      'Keep your core engaged throughout.',
    ],
  },
  anxious: {
    id: '0002',
    name: 'cat-cow stretch',
    bodyPart: 'back',
    equipment: 'body weight',
    gifUrl: '',
    target: 'spine',
    instructions: [
      'Start on hands and knees in tabletop position.',
      'Inhale and arch your back, lifting your head and tailbone (cow).',
      'Exhale and round your back, tucking chin and tailbone (cat).',
      'Flow between the two positions slowly for 1 minute.',
    ],
  },
  tired: {
    id: '0003',
    name: 'neck roll',
    bodyPart: 'neck',
    equipment: 'body weight',
    gifUrl: '',
    target: 'neck',
    instructions: [
      'Sit comfortably with your spine tall.',
      'Slowly drop your right ear to your right shoulder.',
      'Roll your chin down to your chest.',
      'Continue to the left shoulder. Repeat 3 times each way.',
    ],
  },
  motivated: {
    id: '0004',
    name: 'squat',
    bodyPart: 'upper legs',
    equipment: 'body weight',
    gifUrl: '',
    target: 'quads',
    instructions: [
      'Stand with feet shoulder-width apart.',
      'Push your hips back and bend your knees to lower down.',
      'Keep your chest up and knees tracking over toes.',
      'Drive through your heels to return to standing. Do 3 sets of 15.',
    ],
  },
  sad: {
    id: '0005',
    name: 'walking',
    bodyPart: 'cardio',
    equipment: 'body weight',
    gifUrl: '',
    target: 'cardiovascular system',
    instructions: [
      'Put on comfortable shoes and step outside.',
      'Walk at a comfortable pace for 15-20 minutes.',
      'Focus on your breathing and the environment around you.',
      'Let the rhythm of your steps calm your mind.',
    ],
  },
};
