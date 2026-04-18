import { View, Text } from 'react-native';
import type { Mood } from '../../types';

// Lottie requires a Development Build (not Expo Go).
// This component shows an animated emoji fallback for Expo Go compatibility.
// To enable real Lottie: uncomment the LottieView import and swap the View below.

// import LottieView from 'lottie-react-native';
// const NEXI_ANIMATIONS: Record<string, any> = {
//   happy:     require('../../assets/animations/nexi-happy.json'),
//   anxious:   require('../../assets/animations/nexi-anxious.json'),
//   tired:     require('../../assets/animations/nexi-tired.json'),
//   motivated: require('../../assets/animations/nexi-motivated.json'),
//   sad:       require('../../assets/animations/nexi-sad.json'),
// };

const NEXI_EMOJI: Record<string, string> = {
  happy:     '😊',
  anxious:   '😰',
  tired:     '😴',
  motivated: '💪',
  sad:       '😔',
  default:   '🌿',
};

interface NexiPetProps {
  mood?: Mood | null;
  size?: number;
}

export function NexiPet({ mood, size = 120 }: NexiPetProps) {
  const emoji = NEXI_EMOJI[mood ?? 'default'] ?? NEXI_EMOJI.default;

  return (
    <View
      className="items-center justify-center rounded-full bg-mint-light"
      style={{ width: size, height: size }}
    >
      {/* Swap this View+Text for LottieView when using a Development Build */}
      <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
    </View>
  );
}
