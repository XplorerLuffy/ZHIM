import { View, Text, TouchableOpacity } from 'react-native';
import type { Mood } from '../../types';
import { MOOD_EMOJI, MOOD_LABEL, MOOD_COLOR } from '../../types';

const MOODS: Mood[] = ['happy', 'anxious', 'tired', 'motivated', 'sad'];

interface MoodPickerProps {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
}

export function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  return (
    <View className="flex-row justify-between">
      {MOODS.map((mood) => {
        const isSelected = selected === mood;
        return (
          <TouchableOpacity
            key={mood}
            onPress={() => onSelect(mood)}
            activeOpacity={0.8}
            className="items-center"
          >
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mb-1"
              style={{
                backgroundColor: isSelected ? MOOD_COLOR[mood] : '#F0F0F0',
                borderWidth: isSelected ? 2 : 0,
                borderColor: '#1A1A2E',
              }}
            >
              <Text style={{ fontSize: 26 }}>{MOOD_EMOJI[mood]}</Text>
            </View>
            <Text
              className="text-xs text-charcoal/60"
              style={{ fontFamily: isSelected ? 'Poppins_600SemiBold' : 'Poppins_400Regular' }}
            >
              {MOOD_LABEL[mood]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
