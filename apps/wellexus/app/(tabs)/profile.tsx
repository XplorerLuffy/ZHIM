import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth.store';
import { useNexiStore } from '../../src/store/nexi.store';
import { usePlanStore } from '../../src/store/plan.store';
import { useMoodStore } from '../../src/store/mood.store';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { NexiPet } from '../../src/components/nexi/NexiPet';
import { xpThreshold } from '../../src/types';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clear);
  const clearPlan = usePlanStore((s) => s.clear);
  const { xp, level, streak } = useNexiStore();

  const xpNeeded = xpThreshold(level);
  const xpProgress = xp / xpNeeded;
  const emailInitial = (user?.email ?? 'W')[0].toUpperCase();

  // Fetch total mood log count
  const { data: totalLogs = 0 } = useQuery<number>({
    queryKey: ['total-logs', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('mood_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  function confirmSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          clearAuth();
          clearPlan();
          useMoodStore.getState().setMood('happy');
        },
      },
    ]);
  }

  const stats = [
    { label: 'Total Logs', value: String(totalLogs), emoji: '📋' },
    { label: 'Streak',     value: `${streak}d`,       emoji: '🔥' },
    { label: 'Level',      value: String(level),       emoji: '⭐' },
    { label: 'Total XP',   value: String(xp + (level - 1) * 100), emoji: '💫' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-charcoal text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>
            Profile 👤
          </Text>
        </View>

        {/* Avatar + Info */}
        <View className="items-center px-6 mb-6">
          <View className="w-20 h-20 rounded-full bg-lavender items-center justify-center mb-3">
            <Text className="text-charcoal text-3xl" style={{ fontFamily: 'Poppins_700Bold' }}>
              {emailInitial}
            </Text>
          </View>
          <Text className="text-charcoal text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {user?.email?.split('@')[0]}
          </Text>
          <Text className="text-charcoal/40 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
            {user?.email}
          </Text>
        </View>

        {/* Nexi Stats Card */}
        <View className="mx-6 mb-4 bg-charcoal rounded-3xl p-5">
          <View className="flex-row items-center mb-4">
            <NexiPet size={60} />
            <View className="ml-4 flex-1">
              <Text className="text-cream text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                Nexi · Level {level}
              </Text>
              <Text className="text-cream/50 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                {xp} / {xpNeeded} XP to next level
              </Text>
            </View>
          </View>
          <ProgressBar progress={xpProgress} color="#A8EDCA" />
        </View>

        {/* Stats Grid */}
        <View className="mx-6 mb-4 flex-row flex-wrap gap-3">
          {stats.map((stat) => (
            <View
              key={stat.label}
              className="bg-white rounded-2xl p-4 flex-1"
              style={{
                minWidth: '44%',
                shadowColor: '#1A1A2E',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 22 }}>{stat.emoji}</Text>
              <Text className="text-charcoal text-xl mt-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                {stat.value}
              </Text>
              <Text className="text-charcoal/50 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View className="mx-6 bg-white rounded-3xl overflow-hidden"
          style={{ shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
        >
          <View className="px-5 py-4 border-b border-charcoal/5">
            <Text className="text-charcoal/50 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              APP
            </Text>
          </View>

          <View className="px-5 py-4 border-b border-charcoal/5 flex-row items-center justify-between">
            <Text className="text-charcoal text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
              Version
            </Text>
            <Text className="text-charcoal/40 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
              1.0.0
            </Text>
          </View>

          <TouchableOpacity
            onPress={confirmSignOut}
            className="px-5 py-4 flex-row items-center"
            activeOpacity={0.7}
          >
            <Text className="text-red-500 text-sm flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Sign Out
            </Text>
            <Text className="text-red-400">→</Text>
          </TouchableOpacity>
        </View>

        <Text
          className="text-center text-charcoal/30 text-xs mt-8"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Made with 🌿 by Wellexus
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
