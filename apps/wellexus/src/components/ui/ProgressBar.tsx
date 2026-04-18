import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0–1
  label?: string;
  color?: string;
}

export function ProgressBar({ progress, label, color = '#A8EDCA' }: ProgressBarProps) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;

  return (
    <View>
      {label && (
        <Text
          className="text-xs text-charcoal/50 mb-1"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {label}
        </Text>
      )}
      <View className="h-2.5 bg-charcoal/10 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}
