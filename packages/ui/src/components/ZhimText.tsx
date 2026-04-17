import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography } from '../theme';

type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label';

interface ZhimTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  bold?: boolean;
  muted?: boolean;
  dzongkha?: boolean;  // render in Jomolhari font
}

export function ZhimText({
  variant = 'body',
  color,
  bold,
  muted,
  dzongkha,
  style,
  children,
  ...rest
}: ZhimTextProps) {
  const { i18n } = useTranslation();
  const isDzongkha = dzongkha || i18n.language === 'dz';

  return (
    <Text
      style={[
        styles[variant],
        isDzongkha && styles.dzongkha,
        bold && styles.bold,
        muted && styles.muted,
        color ? { color } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.text,
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
  },
  h1: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
  },
  h2: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  h3: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  caption: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  label: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.3,
  },

  dzongkha: {
    fontFamily: typography.fontFamily.dzongkha,
    lineHeight: undefined,  // overridden per variant below; Uchen needs 2x
  },
  bold: { fontWeight: '700' },
  muted: { color: colors.textMuted },
});
