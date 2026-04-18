/**
 * Exercise lookup — calls the get-exercise Edge Function.
 * ExerciseDB / RapidAPI key stays server-side.
 */
import { supabase } from '../lib/supabase';
import type { Exercise, Mood } from '../types';

const PLACEHOLDERS: Record<Mood, Exercise> = {
  happy:     { id: '0001', name: 'push-up',        bodyPart: 'chest',      equipment: 'body weight', gifUrl: '', target: 'pectorals',            instructions: ['Start in plank.', 'Lower chest to floor.', 'Push back up.', 'Keep core engaged.'] },
  anxious:   { id: '0002', name: 'cat-cow stretch', bodyPart: 'back',       equipment: 'body weight', gifUrl: '', target: 'spine',                instructions: ['Start on all fours.', 'Inhale arch back (cow).', 'Exhale round back (cat).', 'Repeat slowly 1 min.'] },
  tired:     { id: '0003', name: 'neck roll',       bodyPart: 'neck',       equipment: 'body weight', gifUrl: '', target: 'neck',                 instructions: ['Sit tall.', 'Drop right ear to shoulder.', 'Roll chin to chest.', 'Repeat 3x each side.'] },
  motivated: { id: '0004', name: 'squat',           bodyPart: 'upper legs', equipment: 'body weight', gifUrl: '', target: 'quads',                instructions: ['Feet shoulder-width.', 'Push hips back.', 'Chest up, knees over toes.', '3 sets of 15.'] },
  sad:       { id: '0005', name: 'walking',         bodyPart: 'cardio',     equipment: 'body weight', gifUrl: '', target: 'cardiovascular system', instructions: ['Put on shoes.', 'Walk 20 minutes outside.', 'Focus on breathing.', 'Let the rhythm calm you.'] },
};

export async function getExerciseByMood(mood: Mood): Promise<Exercise | null> {
  try {
    const { data, error } = await supabase.functions.invoke<Exercise>('get-exercise', {
      body: { mood },
    });
    if (error || !data) return PLACEHOLDERS[mood] ?? null;
    return data;
  } catch {
    return PLACEHOLDERS[mood] ?? null;
  }
}
