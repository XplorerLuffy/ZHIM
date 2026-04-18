import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
}

export function Badge({ label, color = '#C9B8F5', textColor = '#1A1A2E' }: BadgeProps) {
  return (
    <View
      className="rounded-xl px-3 py-1 items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <Text
        className="text-xs"
        style={{ fontFamily: 'Poppins_600SemiBold', color: textColor }}
      >
        {label}
      </Text>
    </View>
  );
}
