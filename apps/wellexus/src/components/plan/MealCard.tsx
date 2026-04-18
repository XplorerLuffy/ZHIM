import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { Card } from '../ui/Card';
import type { SpoonacularRecipe } from '../../types';

interface MealCardProps {
  meal: SpoonacularRecipe | null;
  completed?: boolean;
  onComplete?: () => void;
}

export function MealCard({ meal, completed, onComplete }: MealCardProps) {
  if (!meal) {
    return (
      <Card className="mb-4">
        <Text className="text-charcoal/40 text-center py-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          No meal recommendation yet
        </Text>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <Text style={{ fontSize: 20 }}>🥗</Text>
        <Text
          className="text-charcoal text-base ml-2 flex-1"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Today's Meal
        </Text>
        {completed && (
          <View className="bg-mint rounded-xl px-2 py-0.5">
            <Text className="text-charcoal text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              ✓ Done
            </Text>
          </View>
        )}
      </View>

      {meal.image ? (
        <Image
          source={{ uri: meal.image }}
          className="w-full h-40 rounded-2xl mb-3"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-40 rounded-2xl mb-3 bg-mint-light items-center justify-center">
          <Text style={{ fontSize: 48 }}>🥗</Text>
        </View>
      )}

      <Text
        className="text-charcoal text-lg mb-1"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {meal.title}
      </Text>

      <View className="flex-row gap-4 mb-4">
        <Text className="text-charcoal/50 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
          ⏱ {meal.readyInMinutes} min
        </Text>
        {meal.calories && (
          <Text className="text-charcoal/50 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
            🔥 {Math.round(meal.calories)} cal
          </Text>
        )}
        <Text className="text-charcoal/50 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
          🍽 {meal.servings} servings
        </Text>
      </View>

      {!completed && onComplete && (
        <TouchableOpacity
          onPress={onComplete}
          className="bg-mint rounded-2xl py-3 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-charcoal text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Mark as Eaten ✓
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}
