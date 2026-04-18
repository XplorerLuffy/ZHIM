import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import type { Exercise } from '../../types';

interface WorkoutCardProps {
  workout: Exercise | null;
  completed?: boolean;
  onComplete?: () => void;
}

export function WorkoutCard({ workout, completed, onComplete }: WorkoutCardProps) {
  if (!workout) {
    return (
      <Card className="mb-4">
        <Text className="text-charcoal/40 text-center py-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          No workout recommendation yet
        </Text>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <Text style={{ fontSize: 20 }}>💪</Text>
        <Text
          className="text-charcoal text-base ml-2 flex-1"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Today's Workout
        </Text>
        {completed && (
          <View className="bg-lavender rounded-xl px-2 py-0.5">
            <Text className="text-charcoal text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              ✓ Done
            </Text>
          </View>
        )}
      </View>

      {/* Placeholder for GIF — requires auth headers to load from ExerciseDB */}
      <View className="w-full h-40 rounded-2xl mb-3 bg-lavender-light items-center justify-center">
        <Text style={{ fontSize: 48 }}>🏋️</Text>
      </View>

      <Text
        className="text-charcoal text-lg mb-2"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {workout.name.charAt(0).toUpperCase() + workout.name.slice(1)}
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="bg-lavender-light rounded-xl px-3 py-1">
          <Text className="text-charcoal/70 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
            🎯 {workout.target}
          </Text>
        </View>
        <View className="bg-mint-light rounded-xl px-3 py-1">
          <Text className="text-charcoal/70 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
            🏃 {workout.bodyPart}
          </Text>
        </View>
        <View className="bg-cream rounded-xl px-3 py-1 border border-charcoal/10">
          <Text className="text-charcoal/70 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
            🔧 {workout.equipment}
          </Text>
        </View>
      </View>

      {workout.instructions && workout.instructions.length > 0 && (
        <View className="mb-4">
          <Text className="text-charcoal/70 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Instructions
          </Text>
          {workout.instructions.slice(0, 3).map((step, i) => (
            <Text
              key={i}
              className="text-charcoal/60 text-sm mb-1 leading-5"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {i + 1}. {step}
            </Text>
          ))}
        </View>
      )}

      {!completed && onComplete && (
        <TouchableOpacity
          onPress={onComplete}
          className="bg-lavender rounded-2xl py-3 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-charcoal text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Mark as Done ✓
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}
