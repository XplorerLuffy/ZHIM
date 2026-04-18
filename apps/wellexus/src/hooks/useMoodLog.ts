/**
 * useMoodLog — the core flow hook.
 *
 * Calls the wellness-plan Edge Function which:
 *   - saves the mood log
 *   - generates GPT-4 plan text
 *   - fetches meal (Spoonacular) + workout (ExerciseDB) in parallel
 *   - saves the plan to Supabase
 *   - updates nexi_stats XP + streak
 *
 * All of the above happens server-side in a single call.
 * The frontend only receives the final composed plan object.
 */
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth.store';
import { useMoodStore } from '../store/mood.store';
import { usePlanStore } from '../store/plan.store';
import { useNexiStore } from '../store/nexi.store';
import type { WellnessPlanResponse } from '../services/wellness';

export function useMoodLog() {
  const user = useAuthStore((s) => s.user);
  const { currentMood, currentIntensity, setLogging, setLastLogDate } = useMoodStore();
  const { setActivePlan, setGenerating } = usePlanStore();
  const { addXP, setFromServer } = useNexiStore();

  async function logMoodAndGeneratePlan() {
    if (!user || !currentMood) {
      Toast.show({ type: 'error', text1: 'Please select a mood first' });
      return;
    }

    setLogging(true);
    setGenerating(true);

    try {
      // Single call to wellness-plan Edge Function — handles everything server-side
      const { data, error } = await supabase.functions.invoke<WellnessPlanResponse>(
        'wellness-plan',
        { body: { mood: currentMood, intensity: currentIntensity } },
      );

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Empty response from wellness-plan function');

      // Update local stores with the server response
      setActivePlan({
        id:                   data.plan_id,
        user_id:              user.id,
        mood_log_id:          data.mood_log_id,
        meal:                 data.meal,
        workout:              data.workout,
        mindfulness:          data.mindfulness,
        date:                 data.date,
        created_at:           new Date().toISOString(),
        completedMeal:        false,
        completedWorkout:     false,
        completedMindfulness: false,
      });

      // Optimistic XP update (server already persisted it)
      addXP(10);

      // Sync fresh nexi_stats from server to keep local state accurate
      supabase
        .from('nexi_stats')
        .select('xp, level, streak, last_active')
        .eq('user_id', user.id)
        .single()
        .then(({ data: stats }) => {
          if (stats) setFromServer(stats.xp, stats.level, stats.streak, stats.last_active);
        });

      setLastLogDate(new Date().toISOString().split('T')[0]);

      Toast.show({ type: 'success', text1: '✨ Your plan is ready!' });
      router.push('/(tabs)/plan');
    } catch (err) {
      console.error('useMoodLog error:', err);
      Toast.show({ type: 'error', text1: 'Something went wrong', text2: 'Please try again' });
    } finally {
      setLogging(false);
      setGenerating(false);
    }
  }

  return { logMoodAndGeneratePlan };
}
