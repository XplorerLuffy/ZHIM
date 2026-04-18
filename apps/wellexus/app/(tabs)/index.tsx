import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { NexiPet } from '../../src/components/nexi/NexiPet';
import { MoodPicker } from '../../src/components/mood/MoodPicker';
import { IntensitySlider } from '../../src/components/mood/IntensitySlider';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/store/auth.store';
import { useMoodStore } from '../../src/store/mood.store';
import { useNexiStore } from '../../src/store/nexi.store';
import { usePlanStore } from '../../src/store/plan.store';
import { useMoodLog } from '../../src/hooks/useMoodLog';
import { useAuthBootstrap } from '../../src/hooks/useAuth';
import { xpThreshold } from '../../src/types';

export default function HomeScreen() {
  useAuthBootstrap();

  const user = useAuthStore((s) => s.user);
  const { currentMood, currentIntensity, isLogging, setMood, setIntensity } = useMoodStore();
  const { xp, level, streak } = useNexiStore();
  const activePlan = usePlanStore((s) => s.activePlan);
  const { logMoodAndGeneratePlan } = useMoodLog();

  const xpNeeded = xpThreshold(level);
  const xpProgress = xp / xpNeeded;
  const emailInitial = (user?.email ?? 'W')[0].toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <View>
            <Text className="text-charcoal/50 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
              Good {getTimeOfDay()},
            </Text>
            <Text className="text-charcoal text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
              {user?.email?.split('@')[0] ?? 'Wellness Seeker'} 🌿
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-lavender items-center justify-center">
            <Text className="text-charcoal text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              {emailInitial}
            </Text>
          </View>
        </View>

        {/* Nexi + XP */}
        <View className="items-center px-6 py-4">
          <NexiPet mood={currentMood} size={130} />
          <View className="mt-4 w-full">
            <View className="flex-row justify-between mb-1">
              <Text className="text-charcoal/60 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                🔥 Streak: {streak} days
              </Text>
              <Text className="text-charcoal/60 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                ⭐ Level {level} · {xp}/{xpNeeded} XP
              </Text>
            </View>
            <ProgressBar progress={xpProgress} color="#A8EDCA" />
          </View>
        </View>

        {/* Today's Plan Card */}
        {activePlan ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/plan')}
            activeOpacity={0.9}
            className="mx-6 mb-4"
          >
            <Card className="bg-charcoal">
              <Text className="text-mint text-xs mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                TODAY'S PLAN
              </Text>
              <Text className="text-cream text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Your wellness plan is ready ✨
              </Text>
              <Text className="text-cream/60 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                🥗 {activePlan.meal?.title ?? 'Healthy meal'}{'  '}
                💪 {activePlan.workout?.name ?? 'Workout'}
              </Text>
              <View className="mt-3 bg-mint rounded-xl py-2 items-center">
                <Text className="text-charcoal text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  View Full Plan →
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ) : (
          <Card className="mx-6 mb-4 border border-dashed border-charcoal/20">
            <Text className="text-charcoal/50 text-sm text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
              Log your mood below to generate today's wellness plan ↓
            </Text>
          </Card>
        )}

        {/* Mood Logger */}
        <Card className="mx-6 mb-4">
          <Text className="text-charcoal text-base mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            How are you feeling?
          </Text>
          <MoodPicker selected={currentMood} onSelect={setMood} />

          <View className="h-px bg-charcoal/10 my-5" />

          <Text className="text-charcoal text-sm mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Intensity
          </Text>
          <IntensitySlider value={currentIntensity} onChange={setIntensity} />

          <TouchableOpacity
            onPress={logMoodAndGeneratePlan}
            disabled={!currentMood || isLogging}
            activeOpacity={0.85}
            className={`mt-5 rounded-2xl py-4 items-center ${!currentMood || isLogging ? 'bg-charcoal/30' : 'bg-charcoal'}`}
          >
            <Text className="text-cream text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {isLogging ? 'Generating your plan... ✨' : 'Log Mood & Generate Plan'}
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
