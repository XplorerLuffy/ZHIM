import { View, Text } from 'react-native';
import type { MoodLog } from '../../types';
import { MOOD_COLOR } from '../../types';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface StreakCalendarProps {
  logs: MoodLog[];
  year?: number;
  month?: number;
}

export function StreakCalendar({ logs, year, month }: StreakCalendarProps) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  // Map date string → mood color
  const logMap: Record<string, string> = {};
  for (const log of logs) {
    const d = new Date(log.date);
    if (d.getFullYear() === y && d.getMonth() === m) {
      logMap[d.getDate()] = MOOD_COLOR[log.mood];
    }
  }

  const monthName = new Date(y, m, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View className="bg-white rounded-3xl p-4 mb-4"
      style={{ shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
    >
      <Text
        className="text-charcoal text-base mb-4 text-center"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {monthName}
      </Text>

      {/* Day header */}
      <View className="flex-row mb-2">
        {DAY_LABELS.map((d, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-charcoal/40 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {cells.map((day, idx) => {
          const color = day ? logMap[day] : undefined;
          const isToday = day === now.getDate() && m === now.getMonth() && y === now.getFullYear();

          return (
            <View key={idx} style={{ width: `${100 / 7}%` }} className="items-center py-1">
              {day ? (
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: color ?? 'transparent',
                    borderWidth: isToday ? 2 : 0,
                    borderColor: '#1A1A2E',
                  }}
                >
                  <Text
                    className="text-xs"
                    style={{
                      fontFamily: color ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                      color: color ? '#1A1A2E' : '#1A1A2E80',
                    }}
                  >
                    {day}
                  </Text>
                </View>
              ) : (
                <View className="w-8 h-8" />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
