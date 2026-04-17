import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZhimText } from '@zhim/ui';
import { ZhimButton } from '@zhim/ui';
import { colors, spacing, radii } from '@zhim/ui';
import type { SupportedLanguage } from '@zhim/i18n';
import { SUPPORTED_LANGUAGES } from '@zhim/i18n';
import { useSettingsStore } from '../../store/settings.store';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'zhim_meaning',
    bgColor: colors.primary[500],
    titleKey: 'onboarding.slide1_title',
    subtitleKey: 'onboarding.slide1_subtitle',
    bodyKey: 'onboarding.slide1_body',
    // Uchen script visual mark — ཞིམ rendered large
    dzLabel: 'ཞིམ།',
    showDzLabel: true,
  },
  {
    key: 'favourites',
    bgColor: colors.secondary[500],
    titleKey: 'onboarding.slide2_title',
    subtitleKey: 'onboarding.slide2_subtitle',
    bodyKey: 'onboarding.slide2_body',
    showDzLabel: false,
  },
  {
    key: 'addressing',
    bgColor: '#1A3A4A',  // deep slate — conveys mapping
    titleKey: 'onboarding.slide3_title',
    subtitleKey: 'onboarding.slide3_subtitle',
    bodyKey: 'onboarding.slide3_body',
    showDzLabel: false,
  },
  {
    key: 'payments',
    bgColor: colors.primary[700],
    titleKey: 'onboarding.slide4_title',
    subtitleKey: 'onboarding.slide4_subtitle',
    bodyKey: 'onboarding.slide4_body',
    showDzLabel: false,
  },
];

export default function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const isLast = currentSlide === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      router.replace('/auth/phone');
      return;
    }
    const next = currentSlide + 1;
    scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
    setCurrentSlide(next);
  }

  function handleScroll(e: any) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentSlide(idx);
  }

  function handleLanguageSelect(lang: SupportedLanguage) {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    setShowLanguagePicker(false);
  }

  if (showLanguagePicker) {
    return (
      <View style={[styles.langPicker, { paddingTop: insets.top + spacing[6] }]}>
        <ZhimText variant="h1" style={{ textAlign: 'center', marginBottom: spacing[2] }}>
          {t('onboarding.choose_language')}
        </ZhimText>
        <ZhimText variant="bodySmall" muted style={{ textAlign: 'center', marginBottom: spacing[8] }}>
          ཁྱོད་རང་གི་སྐད་ཡིག་བདམས།
        </ZhimText>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.langOption}
            onPress={() => handleLanguageSelect(lang.code)}
          >
            <ZhimText variant="h3">{lang.label}</ZhimText>
            <ZhimText variant="body" muted dzongkha={lang.code === 'dz'}>
              {lang.nativeLabel}
            </ZhimText>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Language toggle — top right */}
      <TouchableOpacity
        style={[styles.langToggle, { top: insets.top + spacing[2] }]}
        onPress={() => setShowLanguagePicker(true)}
      >
        <ZhimText variant="label" color={colors.white}>
          {i18n.language === 'dz' ? 'EN' : 'རྫོང་ཁ།'}
        </ZhimText>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, idx) => (
          <View key={slide.key} style={[styles.slide, { backgroundColor: slide.bgColor }]}>
            {/* Slide 1: Giant Uchen ཞིམ as visual hero */}
            {slide.showDzLabel && (
              <ZhimText
                dzongkha
                style={styles.dzHero}
                color={colors.white}
              >
                {slide.dzLabel}
              </ZhimText>
            )}

            {!slide.showDzLabel && (
              <View style={styles.illustrationPlaceholder}>
                {/* Replace with Lottie / SVG illustrations */}
                <ZhimText variant="display" color={colors.white} style={{ opacity: 0.15, fontSize: 120 }}>
                  {idx === 1 ? '🥟' : idx === 2 ? '📍' : '💳'}
                </ZhimText>
              </View>
            )}

            <View style={styles.slideContent}>
              <ZhimText
                variant="display"
                color={colors.white}
                style={styles.slideTitle}
                dzongkha={i18n.language === 'dz'}
              >
                {t(slide.titleKey)}
              </ZhimText>
              <ZhimText
                variant="h3"
                color="rgba(255,255,255,0.85)"
                style={styles.slideSubtitle}
                dzongkha={i18n.language === 'dz'}
              >
                {t(slide.subtitleKey)}
              </ZhimText>
              <ZhimText
                variant="body"
                color="rgba(255,255,255,0.70)"
                style={styles.slideBody}
                dzongkha={i18n.language === 'dz'}
              >
                {t(slide.bodyKey)}
              </ZhimText>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              currentSlide === idx ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing[4] }]}>
        <ZhimButton
          label={isLast ? t('onboarding.get_started') : t('onboarding.continue')}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.ctaBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary[500] },

  langToggle: {
    position: 'absolute',
    right: spacing[4],
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },

  langPicker: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing[6],
  },
  langOption: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[3],
    gap: spacing[1],
  },

  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dzHero: {
    fontSize: 140,
    lineHeight: 140 * 1.6,  // Uchen needs generous height
    textAlign: 'center',
    opacity: 0.95,
    marginTop: spacing[16],
  },
  illustrationPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[16],
  },
  slideContent: {
    paddingHorizontal: spacing[8],
    paddingTop: spacing[6],
    gap: spacing[3],
  },
  slideTitle: {
    textAlign: 'center',
    lineHeight: 38,
  },
  slideSubtitle: {
    textAlign: 'center',
    fontWeight: '600',
  },
  slideBody: {
    textAlign: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    backgroundColor: 'transparent',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  dotActive:   { backgroundColor: colors.white, width: 24 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.4)' },

  cta: {
    paddingHorizontal: spacing[6],
    backgroundColor: 'transparent',
  },
  ctaBtn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
});
