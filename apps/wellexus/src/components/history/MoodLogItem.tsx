import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { MoodLog } from '../../types';
import { MOOD_EMOJI, MOOD_LABEL, MOOD_COLOR } from '../../types';

interface MoodLogItemProps {
  log: MoodLog;
}

export function MoodLogItem({ log }: MoodLogItemProps) {
  const date = new Date(log.created_at);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
      style={{ shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
    >
      {/* Mood emoji */}
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: MOOD_COLOR[log.mood] }}
      >
        <Text style={{ fontSize: 22 }}>{MOOD_EMOJI[log.mood]}</Text>
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-charcoal text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {MOOD_LABEL[log.mood]}
        </Text>
        <Text className="text-charcoal/50 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
          {dateStr}
        </Text>
        {/* Intensity dots */}
        <View className="flex-row gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: i <= log.intensity ? MOOD_COLOR[log.mood] : '#E0E0E0' }}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/plan')}
        activeOpacity={0.8}
      >
        <Text className="text-charcoal/40 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
          View Plan →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
