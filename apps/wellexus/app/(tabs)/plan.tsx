import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealCard } from '../../src/components/plan/MealCard';
import { WorkoutCard } from '../../src/components/plan/WorkoutCard';
import { MindfulnessCard } from '../../src/components/plan/MindfulnessCard';
import { usePlanStore } from '../../src/store/plan.store';
import { useNexiStore } from '../../src/store/nexi.store';
import { useAuthStore } from '../../src/store/auth.store';
import { useTodayPlan } from '../../src/hooks/usePlan';
import { supabase } from '../../src/lib/supabase';
import { XP_FOR_ACTIVITY } from '../../src/types';
import Toast from 'react-native-toast-message';

export default function PlanScreen() {
  const { activePlan, isGenerating, markComplete } = usePlanStore();
  const { addXP } = useNexiStore();
  const user = useAuthStore((s) => s.user);
  const { isLoading } = useTodayPlan();

  async function handleComplete(activity: 'meal' | 'workout' | 'mindfulness') {
    markComplete(activity);
    addXP(XP_FOR_ACTIVITY);
    Toast.show({ type: 'success', text1: `+${XP_FOR_ACTIVITY} XP earned! 🌟` });
    if (user) {
      const { xp, level } = useNexiStore.getState();
      await supabase
        .from('nexi_stats')
        .update({ xp, level })
        .eq('user_id', user.id);
    }
  }

  if (isLoading || isGenerating) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#1A1A2E" />
        <Text className="text-charcoal/60 text-sm mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          {isGenerating ? 'Crafting your wellness plan...' : 'Loading your plan...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (!activePlan) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8" edges={['top']}>
        <Text style={{ fontSize: 64 }}>✨</Text>
        <Text
          className="text-charcoal text-xl text-center mt-4"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          No plan yet
        </Text>
        <Text
          className="text-charcoal/50 text-sm text-center mt-2"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Go to Home, log your mood, and let Wellexus create your personalized wellness plan.
        </Text>
      </SafeAreaView>
    );
  }

  const allDone =
    activePlan.completedMeal &&
    activePlan.completedWorkout &&
    activePlan.completedMindfulness;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-charcoal/50 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text className="text-charcoal text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>
            Your Wellness Plan ✨
          </Text>
          {allDone && (
            <View className="mt-3 bg-mint rounded-2xl py-3 px-4">
              <Text className="text-charcoal text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                🎉 Amazing! You completed all activities today!
              </Text>
            </View>
          )}
        </View>

        <View className="px-6">
          <MealCard
            meal={activePlan.meal}
            completed={activePlan.completedMeal}
            onComplete={() => handleComplete('meal')}
          />
          <WorkoutCard
            workout={activePlan.workout}
            completed={activePlan.completedWorkout}
            onComplete={() => handleComplete('workout')}
          />
          <MindfulnessCard
            text={activePlan.mindfulness}
            completed={activePlan.completedMindfulness}
            onComplete={() => handleComplete('mindfulness')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
