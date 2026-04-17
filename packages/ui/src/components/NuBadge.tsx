// Ngultrum price display badge — respects Dzongkha numeral preference
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toDzongkhaNumeral } from '@zhim/i18n';
import { colors, typography } from '../theme';

interface NuBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  strikethrough?: boolean;  // for discounted prices
  color?: string;
}

export function NuBadge({ amount, size = 'md', strikethrough, color }: NuBadgeProps) {
  const { i18n } = useTranslation();
  const useDz = i18n.language === 'dz';

  const numStr = useDz
    ? toDzongkhaNumeral(amount.toLocaleString('en-IN'))
    : amount.toLocaleString('en-IN');

  return (
    <Text
      style={[
        styles.base,
        styles[size],
        strikethrough && styles.strikethrough,
        color ? { color } : undefined,
      ]}
    >
      Nu. {numStr}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.fontFamily.sansBold,
    color: colors.text,
    fontWeight: '700',
  },
  sm: { fontSize: typography.fontSize.sm },
  md: { fontSize: typography.fontSize.base },
  lg: { fontSize: typography.fontSize.lg },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },
});
