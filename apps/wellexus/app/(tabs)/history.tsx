import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth.store';
import { useNexiStore } from '../../src/store/nexi.store';
import { StreakCalendar } from '../../src/components/history/StreakCalendar';
import { MoodLogItem } from '../../src/components/history/MoodLogItem';
import type { MoodLog } from '../../src/types';

export default function HistoryScreen() {
  const user = useAuthStore((s) => s.user);
  const { streak } = useNexiStore();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: logs = [], isLoading } = useQuery<MoodLog[]>({
    queryKey: ['mood-history', user?.id, now.getMonth()],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', firstOfMonth)
        .lte('date', lastOfMonth)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data ?? []) as MoodLog[];
    },
    enabled: !!user,
  });

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-charcoal/50 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
          Your journey
        </Text>
        <Text className="text-charcoal text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>
          Mood History 📅
        </Text>
      </View>

      {/* Streak banner */}
      {streak > 0 && (
        <View className="mx-6 mb-4 bg-charcoal rounded-2xl py-3 px-4 flex-row items-center">
          <Text style={{ fontSize: 24 }}>🔥</Text>
          <View className="ml-3">
            <Text className="text-mint text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              {streak}-Day Streak!
            </Text>
            <Text className="text-cream/60 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
              Keep it up — you're building great habits
            </Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#1A1A2E" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          ListHeaderComponent={
            <StreakCalendar
              logs={logs}
              year={now.getFullYear()}
              month={now.getMonth()}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text
                className="text-charcoal text-base mt-3"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                No logs yet
              </Text>
              <Text
                className="text-charcoal/50 text-sm mt-1 text-center"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Start logging your mood on the Home screen
              </Text>
            </View>
          }
          renderItem={({ item }) => <MoodLogItem log={item} />}
        />
      )}
    </SafeAreaView>
  );
}
