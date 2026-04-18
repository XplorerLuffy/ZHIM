import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth.store';
import { useMoodStore } from '../store/mood.store';
import { usePlanStore } from '../store/plan.store';
import { useNexiStore } from '../store/nexi.store';
import { generateWellnessPlan } from '../services/openai';
import { getMealByQuery } from '../services/spoonacular';
import { getExerciseByMood } from '../services/exercisedb';
import { XP_FOR_MOOD_LOG } from '../types';

export function useMoodLog() {
  const user = useAuthStore((s) => s.user);
  const { currentMood, currentIntensity, setLogging, setLastLogDate } = useMoodStore();
  const { setActivePlan, setGenerating } = usePlanStore();
  const { addXP } = useNexiStore();

  async function logMoodAndGeneratePlan() {
    if (!user || !currentMood) {
      Toast.show({ type: 'error', text1: 'Please select a mood first' });
      return;
    }

    setLogging(true);
    setGenerating(true);

    try {
      // 1. Save mood log to Supabase
      const { data: moodLog, error: moodError } = await supabase
        .from('mood_logs')
        .insert({ user_id: user.id, mood: currentMood, intensity: currentIntensity })
        .select()
        .single();

      if (moodError) throw moodError;

      // 2. Generate GPT-4 wellness plan text
      const gptPlan = await generateWellnessPlan(currentMood, currentIntensity);

      // 3. Fetch meal + workout in parallel
      const [meal, workout] = await Promise.all([
        getMealByQuery(gptPlan.meal_query),
        getExerciseByMood(currentMood),
      ]);

      // 4. Save full plan to Supabase
      const { data: savedPlan, error: planError } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          mood_log_id: moodLog.id,
          meal,
          workout,
          mindfulness: gptPlan.mindfulness,
        })
        .select()
        .single();

      if (planError) throw planError;

      // 5. Award XP
      addXP(XP_FOR_MOOD_LOG);
      const { xp, level } = useNexiStore.getState();
      await supabase
        .from('nexi_stats')
        .update({ xp, level, last_active: new Date().toISOString().split('T')[0] })
        .eq('user_id', user.id);

      // 6. Update plan store
      setActivePlan({
        ...savedPlan,
        meal,
        workout,
        mindfulness: gptPlan.mindfulness,
        completedMeal: false,
        completedWorkout: false,
        completedMindfulness: false,
      });

      setLastLogDate(new Date().toISOString().split('T')[0]);

      Toast.show({ type: 'success', text1: '✨ Your plan is ready!' });
      router.push('/(tabs)/plan');
    } catch (err) {
      console.error('Plan generation failed:', err);
      Toast.show({ type: 'error', text1: 'Something went wrong', text2: 'Please try again' });
    } finally {
      setLogging(false);
      setGenerating(false);
    }
  }

  return { logMoodAndGeneratePlan };
}
