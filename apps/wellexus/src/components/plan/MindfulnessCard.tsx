import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';

interface MindfulnessCardProps {
  text: string;
  completed?: boolean;
  onComplete?: () => void;
}

export function MindfulnessCard({ text, completed, onComplete }: MindfulnessCardProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function toggleTimer() {
    if (timeLeft === 0) {
      setTimeLeft(60);
      setRunning(true);
    } else {
      setRunning((r) => !r);
    }
  }

  const progress = ((60 - timeLeft) / 60) * 100;

  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <Text style={{ fontSize: 20 }}>🧘</Text>
        <Text
          className="text-charcoal text-base ml-2 flex-1"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Mindfulness
        </Text>
        {completed && (
          <View className="bg-mint rounded-xl px-2 py-0.5">
            <Text className="text-charcoal text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              ✓ Done
            </Text>
          </View>
        )}
      </View>

      <Text
        className="text-charcoal/70 text-sm leading-6 mb-5"
        style={{ fontFamily: 'Poppins_400Regular' }}
      >
        {text}
      </Text>

      {/* Timer */}
      <View className="items-center mb-5">
        <View className="w-24 h-24 rounded-full bg-lavender-light items-center justify-center mb-3">
          <Text
            className="text-charcoal text-2xl"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {timeLeft}s
          </Text>
        </View>

        {/* Progress arc (simplified as a bar) */}
        <View className="w-full h-1.5 bg-charcoal/10 rounded-full overflow-hidden">
          <View
            className="h-full bg-lavender rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>

        <TouchableOpacity
          onPress={toggleTimer}
          className="mt-4 bg-charcoal/10 rounded-2xl px-6 py-2"
          activeOpacity={0.8}
        >
          <Text className="text-charcoal text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {timeLeft === 0 ? 'Restart' : running ? 'Pause' : 'Start Timer'}
          </Text>
        </TouchableOpacity>
      </View>

      {!completed && onComplete && (
        <TouchableOpacity
          onPress={onComplete}
          className="bg-charcoal rounded-2xl py-3 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-cream text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Mark as Complete ✓
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}
