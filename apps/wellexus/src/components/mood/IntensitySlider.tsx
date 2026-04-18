import { View, Text, TouchableOpacity } from 'react-native';

const LEVELS = [1, 2, 3, 4, 5];
const LEVEL_LABELS: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very high',
};

interface IntensitySliderProps {
  value: number;
  onChange: (n: number) => void;
}

export function IntensitySlider({ value, onChange }: IntensitySliderProps) {
  return (
    <View>
      <View className="flex-row justify-between mb-3">
        {LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => onChange(level)}
            activeOpacity={0.8}
            className="items-center"
          >
            <View
              className="w-11 h-11 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: value >= level ? '#A8EDCA' : '#F0F0F0',
                borderWidth: value === level ? 2 : 0,
                borderColor: '#1A1A2E',
              }}
            >
              <Text
                className="text-base"
                style={{
                  fontFamily: 'Poppins_600SemiBold',
                  color: value >= level ? '#1A1A2E' : '#1A1A2E60',
                }}
              >
                {level}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <Text
        className="text-center text-xs text-charcoal/50"
        style={{ fontFamily: 'Poppins_400Regular' }}
      >
        {LEVEL_LABELS[value]}
      </Text>
    </View>
  );
}
