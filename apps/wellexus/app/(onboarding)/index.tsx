import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    emoji: '🌿',
    title: 'Your Mood.\nYour Plan.',
    subtitle: 'Log how you feel and get a personalized wellness plan crafted just for you.',
    gradient: ['#A8EDCA', '#C9B8F5'] as [string, string],
  },
  {
    id: 2,
    emoji: '✨',
    title: 'AI-Powered\nWellness',
    subtitle: 'GPT-4 creates your meal, workout, and mindfulness plan based on your mood.',
    gradient: ['#C9B8F5', '#F5C6B8'] as [string, string],
  },
  {
    id: 3,
    emoji: '🐾',
    title: 'Earn XP,\nGrow Nexi',
    subtitle: 'Your wellness companion Nexi grows with you as you complete daily activities.',
    gradient: ['#B8D4F5', '#A8EDCA'] as [string, string],
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const setHasOnboarded = useAuthStore((s) => s.setHasOnboarded);

  function handleScroll(e: any) {
    const slide = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slide);
  }

  function goToNext() {
    if (currentSlide < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentSlide + 1) * width, animated: true });
    }
  }

  function handleGetStarted() {
    setHasOnboarded(true);
    router.replace('/(auth)/login');
  }

  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-cream">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <LinearGradient
            key={slide.id}
            colors={slide.gradient}
            style={{ width, flex: 1 }}
            className="items-center justify-center px-8"
          >
            {/* Illustration placeholder */}
            <View className="w-48 h-48 rounded-full bg-white/30 items-center justify-center mb-10">
              <Text style={{ fontSize: 80 }}>{slide.emoji}</Text>
            </View>

            <Text
              className="text-4xl text-charcoal text-center mb-4"
              style={{ fontFamily: 'Poppins_700Bold', lineHeight: 48 }}
            >
              {slide.title}
            </Text>
            <Text
              className="text-base text-charcoal/70 text-center leading-6"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {slide.subtitle}
            </Text>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Dots + CTA */}
      <View className="absolute bottom-16 left-0 right-0 items-center px-8">
        {/* Dot indicators */}
        <View className="flex-row mb-8 gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === currentSlide ? 'w-6 bg-charcoal' : 'w-2 bg-charcoal/30'}`}
            />
          ))}
        </View>

        {isLast ? (
          <TouchableOpacity
            onPress={handleGetStarted}
            className="w-full bg-charcoal rounded-2xl py-4 items-center"
            activeOpacity={0.85}
          >
            <Text
              className="text-cream text-lg"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Get Started
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="w-full flex-row justify-between items-center">
            <TouchableOpacity onPress={handleGetStarted}>
              <Text
                className="text-charcoal/50 text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Skip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToNext}
              className="bg-charcoal rounded-2xl px-8 py-4"
              activeOpacity={0.85}
            >
              <Text
                className="text-cream text-base"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Next →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
